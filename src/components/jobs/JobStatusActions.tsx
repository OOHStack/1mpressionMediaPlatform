"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { JobStatus } from "@/types";
import { cn } from "@/lib/utils";

const NEXT_ACTIONS: Partial<Record<JobStatus, { label: string; nextStatus: JobStatus; color: string }[]>> = {
  new_request: [
    { label: "Start Review", nextStatus: "needs_review", color: "btn-secondary" },
    { label: "Mark Approved", nextStatus: "approved", color: "btn-primary" },
  ],
  needs_review: [
    { label: "Mark Approved", nextStatus: "approved", color: "btn-primary" },
    { label: "Request Quote", nextStatus: "quoted", color: "btn-secondary" },
  ],
  quoted: [
    { label: "Mark Approved", nextStatus: "approved", color: "btn-primary" },
  ],
  approved: [
    { label: "Needs Assignment", nextStatus: "needs_assignment", color: "btn-primary" },
  ],
  needs_assignment: [
    { label: "Mark Assigned", nextStatus: "assigned", color: "btn-primary" },
  ],
  assigned: [
    { label: "Mark In Progress", nextStatus: "in_progress", color: "btn-primary" },
  ],
  in_progress: [
    { label: "Mark Captured", nextStatus: "captured", color: "btn-primary" },
  ],
  captured: [
    { label: "Mark Delivered", nextStatus: "delivered", color: "btn-primary" },
  ],
  delivered: [
    { label: "Mark Invoiced", nextStatus: "invoiced", color: "btn-primary" },
  ],
  invoiced: [
    { label: "Mark Paid", nextStatus: "paid", color: "btn-primary" },
  ],
  paid: [
    { label: "Close Job", nextStatus: "closed", color: "btn-secondary" },
  ],
};

interface JobStatusActionsProps {
  jobId: string;
  currentStatus: JobStatus;
}

export default function JobStatusActions({ jobId, currentStatus }: JobStatusActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = NEXT_ACTIONS[currentStatus] ?? [];

  if (actions.length === 0) return null;

  async function updateStatus(nextStatus: JobStatus, label: string) {
    setLoading(label);
    await supabase.from("jobs").update({ status: nextStatus }).eq("id", jobId);

    // Log activity
    await supabase.from("activity_log").insert({
      entity_type: "job",
      entity_id: jobId,
      action: "status_change",
      description: `Status changed to ${nextStatus}`,
    });

    router.refresh();
    setLoading(null);
  }

  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-xs text-gray-500 font-medium">Actions:</span>
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => updateStatus(action.nextStatus, action.label)}
          disabled={loading !== null}
          className={cn(action.color, "text-xs py-1.5")}
        >
          {loading === action.label ? "Updating…" : action.label}
        </button>
      ))}
      {currentStatus !== "cancelled" && currentStatus !== "closed" && (
        <button
          onClick={() => updateStatus("cancelled", "Cancel")}
          disabled={loading !== null}
          className="btn-ghost text-red-400 hover:text-red-600 text-xs ml-auto"
        >
          Cancel Job
        </button>
      )}
    </div>
  );
}
