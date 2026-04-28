import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
}

// ---- Structured extraction result ----

export interface EmailExtractionResult {
  is_job_request: boolean;
  confidence: number; // 0-1
  summary: string;
  client_name: string | null;
  company: string | null;
  contact_email: string | null;
  campaign_name: string | null;
  market: string | null;
  city: string | null;
  shoot_date: string | null;
  delivery_deadline: string | null;
  budget: string | null;
  deliverables: string | null;
  job_type: string | null;
  missing_info: string[];
  suggested_reply: string | null;
}

const SYSTEM_PROMPT = `You are an operations assistant for 1mpression Media, a Canadian OOH (out-of-home) photography and videography company. Your job is to analyze incoming emails and extract structured information about potential photography/videography job requests.

1mpression Media captures billboard, digital screen, transit, mall, venue, and other out-of-home advertising campaigns across Canada. Clients are typically advertising agencies, media vendors, and brands.

When analyzing emails, extract job request information and identify what is missing. Be precise — only extract information that is clearly stated, don't hallucinate details. If information is ambiguous, note it in missing_info.

Job types you recognize: photography, videography, drone_photography, drone_video, monitoring, posting_confirmation, custom.

Always respond in valid JSON matching the schema provided.`;

export async function extractEmailJobDetails(
  emailSubject: string,
  emailBody: string,
  fromName: string | null,
  fromEmail: string | null
): Promise<EmailExtractionResult> {
  const client = getAnthropicClient();

  const userMessage = `Analyze this email and extract job request information.

FROM: ${fromName ? `${fromName} <${fromEmail}>` : fromEmail ?? "unknown"}
SUBJECT: ${emailSubject ?? "(no subject)"}
BODY:
${emailBody ?? "(no body)"}

Return a JSON object with exactly these fields:
{
  "is_job_request": boolean,
  "confidence": number between 0 and 1,
  "summary": "1-2 sentence summary of what they're asking for",
  "client_name": "contact person name or null",
  "company": "company/agency name or null",
  "contact_email": "reply-to email or null",
  "campaign_name": "campaign or brand name or null",
  "market": "region/market name or null",
  "city": "specific city or null",
  "shoot_date": "date as YYYY-MM-DD or natural language or null",
  "delivery_deadline": "date as YYYY-MM-DD or natural language or null",
  "budget": "budget amount as string or null",
  "deliverables": "what photos/videos they need or null",
  "job_type": "photography|videography|drone_photography|drone_video|monitoring|posting_confirmation|custom or null",
  "missing_info": ["array of strings describing what information is missing or unclear"],
  "suggested_reply": "a brief professional reply asking for any missing info, or null if all info is present"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/) ?? text.match(/(\{[\s\S]+\})/);
  const jsonStr = jsonMatch?.[1] ?? text;

  try {
    return JSON.parse(jsonStr) as EmailExtractionResult;
  } catch {
    return {
      is_job_request: false,
      confidence: 0,
      summary: "Could not parse AI response.",
      client_name: null,
      company: null,
      contact_email: null,
      campaign_name: null,
      market: null,
      city: null,
      shoot_date: null,
      delivery_deadline: null,
      budget: null,
      deliverables: null,
      job_type: null,
      missing_info: ["AI extraction failed — please review manually"],
      suggested_reply: null,
    };
  }
}

// ---- Draft client reply ----

export async function draftClientReply(
  emailSubject: string,
  emailBody: string,
  fromName: string | null,
  extraction: EmailExtractionResult
): Promise<string> {
  const client = getAnthropicClient();

  const missingList = extraction.missing_info.length > 0
    ? `Missing information we need to ask about:\n${extraction.missing_info.map((m) => `- ${m}`).join("\n")}`
    : "All required information appears to be present.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `${SYSTEM_PROMPT}\n\nYou are drafting a professional, friendly reply email on behalf of 1mpression Media. Keep it concise, warm, and clear. Sign off as "1mpression Media Team". Do not use em-dashes. Do not mention AI or automation.`,
    messages: [
      {
        role: "user",
        content: `Draft a reply to this email. Acknowledge their request and ask for any missing information.\n\nOriginal email from ${fromName ?? "the client"}:\nSubject: ${emailSubject}\n\n${emailBody}\n\n${missingList}\n\nReturn ONLY the email body text, no subject line.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ---- Draft contractor assignment message ----

export async function draftContractorMessage(
  contractorName: string,
  jobDetails: {
    campaignName: string;
    client: string;
    city: string;
    shootDate: string;
    deliveryDeadline: string;
    requirements: string;
    rate: string;
    locationCount: number;
  }
): Promise<{ email: string; sms: string }> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: `${SYSTEM_PROMPT}\n\nYou draft outreach messages to freelance photographers and videographers. Be friendly, professional, and include all relevant details. Never promise specific payment terms beyond what is given. Sign off as "1mpression Media Ops".`,
    messages: [
      {
        role: "user",
        content: `Draft both an email and a short SMS/WhatsApp message to reach out to a contractor about a shoot.

Contractor: ${contractorName}
Campaign: ${jobDetails.campaignName}
Client: ${jobDetails.client}
City: ${jobDetails.city}
Shoot Date: ${jobDetails.shootDate}
Delivery Deadline: ${jobDetails.deliveryDeadline}
Number of Locations: ${jobDetails.locationCount}
Rate: ${jobDetails.rate}
Requirements: ${jobDetails.requirements}

Return ONLY a JSON object: { "email": "...", "sms": "..." }`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/) ?? text.match(/(\{[\s\S]+\})/);
  try {
    return JSON.parse(jsonMatch?.[1] ?? text);
  } catch {
    return { email: text, sms: "" };
  }
}
