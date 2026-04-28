import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { extractEmailJobDetails } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { emailId } = await request.json();
  if (!emailId) return NextResponse.json({ error: "emailId required" }, { status: 400 });

  // Fetch the email
  const { data: email } = await supabase
    .from("email_intake")
    .select("*")
    .eq("id", emailId)
    .single();

  if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 });

  const bodyText = email.body_text ?? email.body_html?.replace(/<[^>]+>/g, " ") ?? "";

  const result = await extractEmailJobDetails(
    email.subject ?? "",
    bodyText.slice(0, 4000), // cap at 4k chars to stay within tokens
    email.from_name,
    email.from_email
  );

  // Store results
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await serviceSupabase.from("email_intake").update({
    status: "reviewing",
    ai_summary: result.summary,
    ai_extracted_client: result.client_name,
    ai_extracted_company: result.company,
    ai_extracted_campaign: result.campaign_name,
    ai_extracted_market: result.market ?? result.city,
    ai_extracted_shoot_date: result.shoot_date,
    ai_extracted_deadline: result.delivery_deadline,
    ai_extracted_budget: result.budget,
    ai_extracted_deliverables: result.deliverables,
    ai_missing_info: result.missing_info,
    ai_confidence: result.confidence,
  }).eq("id", emailId);

  return NextResponse.json({ ok: true, result });
}
