import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import {
  getAuthenticatedOAuth2Client,
  getLastSyncTime,
  setLastSyncTime,
  parseGmailMessage,
} from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const oauth2 = await getAuthenticatedOAuth2Client();
  if (!oauth2) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  // Build the query — fetch emails since last sync, or last 30 days
  const lastSync = await getLastSyncTime();
  let query = "in:inbox";
  if (lastSync) {
    const after = Math.floor(new Date(lastSync).getTime() / 1000);
    query += ` after:${after}`;
  } else {
    // First sync — last 30 days
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    query += ` after:${thirtyDaysAgo}`;
  }

  // List messages
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
  });

  const messages = listResponse.data.messages ?? [];
  if (messages.length === 0) {
    await setLastSyncTime(new Date().toISOString());
    return NextResponse.json({ synced: 0, message: "No new emails found." });
  }

  // Use service-role client to write to email_intake
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check which message IDs we already have
  const messageIds = messages.map((m) => m.id!).filter(Boolean);
  const { data: existing } = await serviceSupabase
    .from("email_intake")
    .select("gmail_message_id")
    .in("gmail_message_id", messageIds);

  const existingIds = new Set((existing ?? []).map((e: any) => e.gmail_message_id));
  const newMessages = messages.filter((m) => !existingIds.has(m.id!));

  let syncedCount = 0;
  const errors: string[] = [];

  for (const msg of newMessages) {
    try {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });

      const parsed = parseGmailMessage(full.data);

      await serviceSupabase.from("email_intake").insert({
        gmail_message_id: parsed.gmailMessageId,
        gmail_thread_id: parsed.gmailThreadId,
        from_name: parsed.fromName,
        from_email: parsed.fromEmail,
        subject: parsed.subject,
        body_text: parsed.bodyText,
        body_html: parsed.bodyHtml,
        received_at: parsed.receivedAt,
        status: "unread",
        attachments: parsed.attachments.length > 0 ? parsed.attachments : null,
      });

      syncedCount++;
    } catch (err) {
      errors.push(`${msg.id}: ${err instanceof Error ? err.message : "error"}`);
    }
  }

  await setLastSyncTime(new Date().toISOString());

  return NextResponse.json({
    synced: syncedCount,
    skipped: existingIds.size,
    errors: errors.length > 0 ? errors : undefined,
    message: `Synced ${syncedCount} new email${syncedCount !== 1 ? "s" : ""}.`,
  });
}
