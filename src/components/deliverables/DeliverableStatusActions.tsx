"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

interface DeliverableStatusActionsProps {
  deliverableId: string;
  currentStatus: string;
  jobId: string;
}

export default function DeliverableStatusActions({
  deliverableId,
  currentStatus,
  jobId,
}: DeliverableStatusActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [deliverModal, setDeliverModal] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);

  async function update(fields: Record<string, unknown>, key: string) {
    setLoading(key);
    await supabase.from("deliverables").update(fields).eq("id", deliverableId);
    await supabase.from("activity_log").insert({
      entity_type: "deliverable",
      entity_id: deliverableId,
      action: "status_change",
      description: `Deliverable ${key}`,
    });
    router.refresh();
    setLoading(null);
  }

  async function handleReject() {
    await update({ status: "rejected", revision_notes: revisionNote || null }, "reject");
    setRejectModal(false);
  }

  async function handleDeliver() {
    await update(
      {
        status: "delivered",
        delivered_at: new Date(deliveryDate).toISOString(),
      },
      "deliver"
    );
    // Check if all deliverables for this job are delivered → update job status
    const { data: remaining } = await supabase
      .from("deliverables")
      .select("id")
      .eq("job_id", jobId)
      .not("status", "in", '("delivered","approved")');

    if (!remaining || remaining.length === 0) {
      await supabase.from("jobs").update({ status: "delivered" }).eq("id", jobId);
    }
    setDeliverModal(false);
  }

  if (currentStatus === "delivered") return null;

  return (
    <>
      <div className="flex gap-1 flex-wrap justify-end">
        {currentStatus === "pending" && (
          <button
            onClick={() => update({ status: "uploaded" }, "uploaded")}
            disabled={loading !== null}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 border border-blue-200"
          >
            {loading === "uploaded" ? "…" : "Mark Uploaded"}
          </button>
        )}

        {currentStatus === "uploaded" && (
          <>
            <button
              onClick={() => update({ status: "reviewed" }, "reviewed")}
              disabled={loading !== null}
              className="text-xs text-yellow-700 hover:text-yellow-800 font-medium px-2 py-1 rounded hover:bg-yellow-50 border border-yellow-200"
            >
              {loading === "reviewed" ? "…" : "Mark Reviewed"}
            </button>
            <button
              onClick={() => setRejectModal(true)}
              className="text-xs text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 border border-red-200"
            >
              Reject
            </button>
          </>
        )}

        {currentStatus === "reviewed" && (
          <>
            <button
              onClick={() => update({ status: "approved", approved_at: new Date().toISOString() }, "approved")}
              disabled={loading !== null}
              className="text-xs text-green-700 hover:text-green-800 font-medium px-2 py-1 rounded hover:bg-green-50 border border-green-200"
            >
              {loading === "approved" ? "…" : "Approve"}
            </button>
            <button
              onClick={() => setRejectModal(true)}
              className="text-xs text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 border border-red-200"
            >
              Reject
            </button>
          </>
        )}

        {currentStatus === "approved" && (
          <button
            onClick={() => setDeliverModal(true)}
            className="text-xs text-teal-700 hover:text-teal-800 font-medium px-2 py-1 rounded hover:bg-teal-50 border border-teal-200"
          >
            Mark Delivered
          </button>
        )}

        {currentStatus === "rejected" && (
          <button
            onClick={() => update({ status: "uploaded", revision_notes: null }, "re-upload")}
            disabled={loading !== null}
            className="text-xs text-blue-600 font-medium px-2 py-1 rounded hover:bg-blue-50 border border-blue-200"
          >
            {loading === "re-upload" ? "…" : "Mark Re-uploaded"}
          </button>
        )}
      </div>

      {/* Reject modal */}
      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject File" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Revision Notes</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="What needs to be fixed or re-shot?"
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setRejectModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReject} disabled={loading !== null} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
              {loading === "reject" ? "Saving…" : "Reject"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deliver modal */}
      <Modal open={deliverModal} onClose={() => setDeliverModal(false)} title="Mark as Delivered to Client" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Confirm delivery date and mark this file as delivered to the client.</p>
          <div>
            <label className="label">Delivery Date</label>
            <input type="date" className="input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeliverModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDeliver} disabled={loading !== null} className="btn-primary">
              {loading === "deliver" ? "Saving…" : "Mark Delivered"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
