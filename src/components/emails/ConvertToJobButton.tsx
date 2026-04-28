"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface ConvertToJobButtonProps {
  emailId: string;
  email: {
    from_name: string | null;
    from_email: string | null;
    subject: string | null;
    ai_extracted_campaign: string | null;
    ai_extracted_market: string | null;
  };
}

export default function ConvertToJobButton({ emailId, email }: ConvertToJobButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [campaignName, setCampaignName] = useState(email.ai_extracted_campaign ?? email.subject ?? "");
  const [market, setMarket] = useState(email.ai_extracted_market ?? "");

  async function handleConvert() {
    setConverting(true);

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        campaign_name: campaignName || email.subject || "Untitled Job",
        market: market || null,
        status: "new_request",
        source: "email",
        email_intake_id: emailId,
      })
      .select("id")
      .single();

    if (error) { setConverting(false); return; }

    await supabase
      .from("email_intake")
      .update({ status: "converted", converted_job_id: job.id, converted_at: new Date().toISOString() })
      .eq("id", emailId);

    router.push(`/jobs/${job.id}/edit`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-xs">
        Convert to Job <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Convert Email to Job"
        description="Review extracted details before creating the job."
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Campaign Name</label>
            <input
              className="input"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Enter campaign name…"
            />
          </div>
          <div>
            <label className="label">Market / City</label>
            <input
              className="input"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              placeholder="e.g. Toronto"
            />
          </div>
          <p className="text-xs text-gray-500">
            A new job will be created with status &ldquo;New Request&rdquo;. You can fill in all details after.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleConvert}
              disabled={converting || !campaignName}
              className="btn-primary"
            >
              {converting ? "Creating…" : "Create Job"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
