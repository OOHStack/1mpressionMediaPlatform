"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiExtractionPanelProps {
  emailId: string;
  hasAiKey: boolean;
  email: {
    status: string;
    ai_summary: string | null;
    ai_confidence: number | null;
    ai_extracted_client: string | null;
    ai_extracted_company: string | null;
    ai_extracted_campaign: string | null;
    ai_extracted_market: string | null;
    ai_extracted_shoot_date: string | null;
    ai_extracted_deadline: string | null;
    ai_extracted_budget: string | null;
    ai_extracted_deliverables: string | null;
    ai_missing_info: string[] | null;
  };
}

export default function AiExtractionPanel({ emailId, hasAiKey, email }: AiExtractionPanelProps) {
  const router = useRouter();
  const [extracting, setExtracting] = useState(false);
  const [draftingReply, setDraftingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [replyCopied, setReplyCopied] = useState(false);
  const [showReply, setShowReply] = useState(false);

  const hasExtraction = !!email.ai_summary;

  async function runExtraction() {
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/extract-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Extraction failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setExtracting(false);
    }
  }

  async function draftReply() {
    setDraftingReply(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Draft failed");
      } else {
        setReply(json.reply);
        setShowReply(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setDraftingReply(false);
    }
  }

  async function copyReply() {
    if (!reply) return;
    await navigator.clipboard.writeText(reply);
    setReplyCopied(true);
    setTimeout(() => setReplyCopied(false), 2000);
  }

  const fields = [
    { label: "Client", value: email.ai_extracted_client },
    { label: "Company", value: email.ai_extracted_company },
    { label: "Campaign", value: email.ai_extracted_campaign },
    { label: "Market", value: email.ai_extracted_market },
    { label: "Shoot Date", value: email.ai_extracted_shoot_date },
    { label: "Deadline", value: email.ai_extracted_deadline },
    { label: "Budget", value: email.ai_extracted_budget },
    { label: "Deliverables", value: email.ai_extracted_deliverables },
  ].filter(f => f.value);

  return (
    <div className="card p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-gray-900">AI Extraction</h2>
          {hasExtraction && email.ai_confidence != null && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              email.ai_confidence >= 0.8 ? "bg-green-100 text-green-700" :
              email.ai_confidence >= 0.5 ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-500"
            )}>
              {Math.round(email.ai_confidence * 100)}% confidence
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasExtraction && (
            <button
              onClick={draftReply}
              disabled={draftingReply || !hasAiKey}
              className="btn-secondary text-xs"
            >
              {draftingReply ? "Drafting…" : "Draft Reply"}
            </button>
          )}
          <button
            onClick={runExtraction}
            disabled={extracting || !hasAiKey}
            className="btn-primary text-xs"
            title={!hasAiKey ? "ANTHROPIC_API_KEY not configured" : undefined}
          >
            <Zap className={cn("w-3.5 h-3.5", extracting && "animate-pulse")} />
            {extracting ? "Extracting…" : hasExtraction ? "Re-run" : "Run AI Extraction"}
          </button>
        </div>
      </div>

      {!hasAiKey && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-3">
          Add <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to .env.local to enable AI extraction.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600 mb-3">
          {error}
        </div>
      )}

      {hasExtraction ? (
        <div className="space-y-3">
          {email.ai_summary && (
            <p className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
              ✦ {email.ai_summary}
            </p>
          )}

          {fields.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
              {fields.map(f => (
                <div key={f.label}>
                  <dt className="text-xs text-gray-500">{f.label}</dt>
                  <dd className="text-sm text-gray-800 font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {email.ai_missing_info && email.ai_missing_info.length > 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-semibold text-yellow-700">Missing information</span>
              </div>
              <ul className="space-y-0.5">
                {email.ai_missing_info.map((item, i) => (
                  <li key={i} className="text-xs text-yellow-700">· {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          {hasAiKey
            ? "Click Run AI Extraction to automatically extract job details from this email."
            : "Configure your Claude API key to enable AI-powered extraction."}
        </p>
      )}

      {/* Draft reply panel */}
      {reply && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowReply(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-700"
            >
              {showReply ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Drafted Reply
            </button>
            <button
              onClick={copyReply}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
            >
              {replyCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {replyCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          {showReply && (
            <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed border border-gray-100">
              {reply}
            </pre>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Review before sending. This draft is not sent automatically.
          </p>
        </div>
      )}
    </div>
  );
}
