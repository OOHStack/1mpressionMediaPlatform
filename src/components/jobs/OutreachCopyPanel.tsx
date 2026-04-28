"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface OutreachCopyPanelProps {
  job: {
    campaign_name: string;
    job_number: string | null;
    city: string | null;
    market: string | null;
    shoot_date: string | null;
    shoot_time: string | null;
    delivery_deadline: string | null;
    deliverables_required: string | null;
    shoot_requirements: string | null;
    client?: { company: string } | null;
  };
  assignment: {
    agreed_rate: number | null;
    rate_unit: string | null;
  };
  contractor: {
    name: string;
    preferred_payment?: string | null;
    payment_email?: string | null;
  } | null;
  locations: {
    name: string | null;
    address: string | null;
    board_id: string | null;
  }[];
}

function buildEmailCopy(
  job: OutreachCopyPanelProps["job"],
  assignment: OutreachCopyPanelProps["assignment"],
  contractor: OutreachCopyPanelProps["contractor"],
  locations: OutreachCopyPanelProps["locations"]
): string {
  const name = contractor?.name?.split(" ")[0] ?? "there";
  const locationList = locations.length > 0
    ? locations.map((l, i) => `  ${i + 1}. ${l.name ?? "Location"}${l.address ? ` — ${l.address}` : ""}${l.board_id ? ` (ID: ${l.board_id})` : ""}`).join("\n")
    : "  Locations TBD — please see attached brief";

  const rate = assignment.agreed_rate
    ? `$${assignment.agreed_rate} ${assignment.rate_unit ? `per ${assignment.rate_unit.replace("_", " ")}` : "flat fee"}`
    : "Rate TBD";

  return `Hi ${name},

Hope you're doing well! I have a shoot opportunity for you and wanted to reach out to see if you're available.

CAMPAIGN: ${job.campaign_name}
CLIENT: ${job.client?.company ?? "Confidential"}
MARKET: ${job.city ?? job.market ?? "TBD"}
SHOOT DATE: ${formatDate(job.shoot_date) ?? "TBD"}${job.shoot_time ? ` at ${job.shoot_time}` : ""}
DELIVERY DEADLINE: ${formatDate(job.delivery_deadline) ?? "TBD"}
RATE: ${rate}

LOCATIONS (${locations.length || "TBD"}):
${locationList}

${job.shoot_requirements ? `REQUIREMENTS:\n${job.shoot_requirements}\n\n` : ""}DELIVERABLES:
${job.deliverables_required ?? "High-resolution JPEGs for each location, submitted via the shared upload folder."}

I'll send a full brief with Google Maps links once you confirm. Let me know if you're in!

Please reply with:
✅ Available
❌ Not available

Thanks,
1mpression Media Operations`;
}

function buildSMSCopy(
  job: OutreachCopyPanelProps["job"],
  assignment: OutreachCopyPanelProps["assignment"],
  contractor: OutreachCopyPanelProps["contractor"]
): string {
  const name = contractor?.name?.split(" ")[0] ?? "";
  const rate = assignment.agreed_rate ? `$${assignment.agreed_rate}/${assignment.rate_unit ?? "flat"}` : "rate TBD";
  return `Hey ${name}! Got a shoot in ${job.city ?? job.market ?? "your area"} on ${formatDate(job.shoot_date) ?? "TBD"} for ${job.campaign_name}. ${rate}. Are you available? -1mpression Media`;
}

export default function OutreachCopyPanel({ job, assignment, contractor, locations }: OutreachCopyPanelProps) {
  const [tab, setTab] = useState<"email" | "sms">("email");
  const [copied, setCopied] = useState(false);

  const emailCopy = buildEmailCopy(job, assignment, contractor, locations);
  const smsCopy = buildSMSCopy(job, assignment, contractor);
  const activeCopy = tab === "email" ? emailCopy : smsCopy;

  async function handleCopy() {
    await navigator.clipboard.writeText(activeCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Outreach Copy</h2>
        <button onClick={handleCopy} className="btn-ghost text-xs gap-1.5">
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
        Review and edit before sending. Nothing is sent automatically.
      </p>

      <div className="flex gap-1 mb-3">
        {(["email", "sms"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "email" ? "Email" : "SMS / WhatsApp"}
          </button>
        ))}
      </div>

      <textarea
        className="input min-h-[320px] resize-y font-mono text-xs leading-relaxed"
        value={activeCopy}
        readOnly
      />

      <p className="text-xs text-gray-400 mt-2">
        Copy this text, then send via your email client, SMS, or WhatsApp.
      </p>
    </div>
  );
}
