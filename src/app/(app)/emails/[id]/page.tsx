import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ConvertToJobButton from "@/components/emails/ConvertToJobButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function EmailDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: email } = await supabase.from("email_intake").select("*").eq("id", id).single();
  if (!email) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href="/emails" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Email Intake
        </Link>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{email.subject ?? "(no subject)"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            From: {email.from_name ?? email.from_email ?? "Unknown"} · {formatDate(email.received_at ?? email.created_at)}
          </p>
        </div>
        {email.status !== "converted" && (
          <ConvertToJobButton emailId={id} email={email} />
        )}
        {email.status === "converted" && email.converted_job_id && (
          <Link href={`/jobs/${email.converted_job_id}`} className="btn-primary text-xs">
            View Job <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* AI Summary (placeholder for Phase 3) */}
      <div className="card p-5 mb-5">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">AI Extraction (Phase 3)</h2>
        {email.ai_summary ? (
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">{email.ai_summary}</p>
            {email.ai_extracted_client && <p><span className="text-gray-500">Client:</span> {email.ai_extracted_client}</p>}
            {email.ai_extracted_campaign && <p><span className="text-gray-500">Campaign:</span> {email.ai_extracted_campaign}</p>}
            {email.ai_extracted_market && <p><span className="text-gray-500">Market:</span> {email.ai_extracted_market}</p>}
            {email.ai_extracted_shoot_date && <p><span className="text-gray-500">Shoot Date:</span> {email.ai_extracted_shoot_date}</p>}
            {email.ai_extracted_budget && <p><span className="text-gray-500">Budget:</span> {email.ai_extracted_budget}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-400">AI extraction available in Phase 3 (Gmail OAuth + Claude API).</p>
        )}
      </div>

      {/* Raw message */}
      <div className="card p-5">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Message</h2>
        {email.body_text ? (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{email.body_text}</pre>
        ) : (
          <p className="text-sm text-gray-400">No message body.</p>
        )}
      </div>
    </div>
  );
}
