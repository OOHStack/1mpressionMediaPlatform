import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { draftClientReply } from "@/lib/ai";
import type { EmailExtractionResult } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { emailId } = await request.json();

  const { data: email } = await supabase
    .from("email_intake")
    .select("*")
    .eq("id", emailId)
    .single();

  if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 });

  const extraction: EmailExtractionResult = {
    is_job_request: true,
    confidence: email.ai_confidence ?? 0.5,
    summary: email.ai_summary ?? "",
    client_name: email.ai_extracted_client,
    company: email.ai_extracted_company,
    contact_email: email.from_email,
    campaign_name: email.ai_extracted_campaign,
    market: email.ai_extracted_market,
    city: null,
    shoot_date: email.ai_extracted_shoot_date,
    delivery_deadline: email.ai_extracted_deadline,
    budget: email.ai_extracted_budget,
    deliverables: email.ai_extracted_deliverables,
    job_type: null,
    missing_info: email.ai_missing_info ?? [],
    suggested_reply: null,
  };

  const bodyText = email.body_text ?? "";
  const reply = await draftClientReply(
    email.subject ?? "",
    bodyText.slice(0, 3000),
    email.from_name,
    extraction
  );

  return NextResponse.json({ reply });
}
