import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowRight, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import ConvertToJobButton from "@/components/emails/ConvertToJobButton";
import AiExtractionPanel from "@/components/emails/AiExtractionPanel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  converted: "bg-green-100 text-green-700",
  ignored: "bg-gray-100 text-gray-500",
  spam: "bg-red-100 text-red-600",
};

export default async function EmailDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: email } = await supabase
    .from("email_intake")
    .select("*")
    .eq("id", id)
    .single();

  if (!email) notFound();

  const hasAiKey = !!process.env.ANTHROPIC_API_KEY;

  // Mark as reviewing when first opened (was unread)
  if (email.status === "unread") {
    await supabase
      .from("email_intake")
      .update({ status: "reviewing" })
      .eq("id", id);
    email.status = "reviewing";
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href="/emails" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Email Intake
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {email.subject ?? "(no subject)"}
            </h1>
            <span className={cn("badge shrink-0", STATUS_COLORS[email.status] ?? "bg-gray-100 text-gray-600")}>
              {email.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium text-gray-700">
              {email.from_name ?? email.from_email ?? "Unknown sender"}
            </span>
            {email.from_name && email.from_email && (
              <span className="text-gray-400">&lt;{email.from_email}&gt;</span>
            )}
            <span className="text-gray-300">·</span>
            <span>{formatDate(email.received_at ?? email.created_at)}</span>
          </div>
        </div>
        <div className="shrink-0">
          {email.status === "converted" && email.converted_job_id ? (
            <Link href={`/jobs/${email.converted_job_id}`} className="btn-primary text-xs">
              View Job <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : email.status !== "converted" ? (
            <ConvertToJobButton emailId={id} email={email} />
          ) : null}
        </div>
      </div>

      {/* AI Extraction */}
      <AiExtractionPanel emailId={id} hasAiKey={hasAiKey} email={email} />

      {/* Email body */}
      <div className="card p-5">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Message</h2>
        {email.body_html ? (
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: email.body_html }}
          />
        ) : email.body_text ? (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {email.body_text}
          </pre>
        ) : (
          <p className="text-sm text-gray-400">No message body.</p>
        )}
      </div>
    </div>
  );
}
