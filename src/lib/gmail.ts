import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const SETTINGS_KEY = "gmail_oauth_tokens";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
];

// Service-role Supabase client for reading/writing settings server-side
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
  );
}

export function getAuthUrl(): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function storeTokens(tokens: Record<string, unknown>) {
  const supabase = getServiceClient();
  await supabase.from("app_settings").upsert({
    key: SETTINGS_KEY,
    value: tokens,
    updated_at: new Date().toISOString(),
  });
}

export async function getStoredTokens(): Promise<Record<string, unknown> | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .single();
  return data?.value ?? null;
}

export async function deleteTokens() {
  const supabase = getServiceClient();
  await supabase.from("app_settings").delete().eq("key", SETTINGS_KEY);
}

export async function getAuthenticatedOAuth2Client() {
  const tokens = await getStoredTokens();
  if (!tokens) return null;

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials(tokens as Parameters<typeof oauth2.setCredentials>[0]);

  // Auto-refresh if expired
  oauth2.on("tokens", async (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    await storeTokens(merged);
  });

  return oauth2;
}

export async function getLastSyncTime(): Promise<string | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "gmail_last_sync")
    .single();
  return (data?.value as Record<string, unknown>)?.timestamp as string ?? null;
}

export async function setLastSyncTime(ts: string) {
  const supabase = getServiceClient();
  await supabase.from("app_settings").upsert({
    key: "gmail_last_sync",
    value: { timestamp: ts },
    updated_at: new Date().toISOString(),
  });
}

// ---- Email parsing helpers ----

export interface ParsedEmail {
  gmailMessageId: string;
  gmailThreadId: string;
  fromName: string | null;
  fromEmail: string | null;
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: string | null;
  attachments: { filename: string; mimeType: string; size: number }[];
}

function decodeBase64(s: string): string {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractBody(payload: any): { text: string | null; html: string | null } {
  let text: string | null = null;
  let html: string | null = null;

  function walk(part: any) {
    if (!part) return;
    const mime = part.mimeType ?? "";
    if (mime === "text/plain" && part.body?.data) {
      text = decodeBase64(part.body.data);
    } else if (mime === "text/html" && part.body?.data) {
      html = decodeBase64(part.body.data);
    }
    if (part.parts) part.parts.forEach(walk);
  }

  walk(payload);
  return { text, html };
}

function parseFromHeader(from: string): { name: string | null; email: string | null } {
  // Format: "Name <email@domain.com>" or just "email@domain.com"
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  const emailOnly = from.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  return { name: null, email: emailOnly?.[0] ?? from };
}

export function parseGmailMessage(msg: any): ParsedEmail {
  const headers: Record<string, string> = {};
  (msg.payload?.headers ?? []).forEach((h: any) => {
    headers[h.name.toLowerCase()] = h.value;
  });

  const from = parseFromHeader(headers["from"] ?? "");
  const { text, html } = extractBody(msg.payload);

  const attachments: ParsedEmail["attachments"] = [];
  function walkAttachments(part: any) {
    if (!part) return;
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size ?? 0,
      });
    }
    if (part.parts) part.parts.forEach(walkAttachments);
  }
  walkAttachments(msg.payload);

  const internalDate = msg.internalDate
    ? new Date(parseInt(msg.internalDate, 10)).toISOString()
    : null;

  return {
    gmailMessageId: msg.id,
    gmailThreadId: msg.threadId,
    fromName: from.name,
    fromEmail: from.email,
    subject: headers["subject"] ?? null,
    bodyText: text,
    bodyHtml: html,
    receivedAt: internalDate,
    attachments,
  };
}
