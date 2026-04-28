"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface AssignmentActionsProps {
  assignmentId: string;
  jobId: string;
  currentStatus: string;
  contractorPaid: boolean;
  invoiceAmount: number | null;
}

export default function AssignmentActions({
  assignmentId,
  jobId,
  currentStatus,
  contractorPaid,
  invoiceAmount,
}: AssignmentActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [payModal, setPayModal] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceAmt, setInvoiceAmt] = useState(invoiceAmount?.toString() ?? "");
  const [payMethod, setPayMethod] = useState("etransfer");
  const [declineReason, setDeclineReason] = useState("");
  const [declineModal, setDeclineModal] = useState(false);

  async function update(
    fields: Record<string, unknown>,
    loadingKey: string,
    jobStatus?: string
  ) {
    setLoading(loadingKey);
    await supabase.from("assignments").update(fields).eq("id", assignmentId);
    if (jobStatus) {
      await supabase.from("jobs").update({ status: jobStatus }).eq("id", jobId);
    }
    router.refresh();
    setLoading(null);
  }

  async function handleDecline() {
    await update(
      { status: "declined", declined_at: new Date().toISOString(), decline_reason: declineReason || null },
      "decline",
      "needs_assignment"
    );
    setDeclineModal(false);
  }

  async function handleLogInvoice() {
    await update(
      {
        contractor_invoice_amount: parseFloat(invoiceAmt) || null,
        contractor_invoice_received_at: new Date().toISOString(),
      },
      "log_invoice"
    );
    setInvoiceModal(false);
  }

  async function handleMarkPaid() {
    await update(
      {
        contractor_paid_at: new Date().toISOString(),
        payment_method: payMethod,
        status: "completed",
      },
      "pay",
      "captured"
    );
    setPayModal(false);
  }

  return (
    <>
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>
        <div className="space-y-2">
          {currentStatus === "draft" && (
            <button
              onClick={() => update({ status: "pending_send" }, "ready")}
              disabled={loading !== null}
              className="btn-primary w-full justify-center text-xs"
            >
              {loading === "ready" ? "Updating…" : "Mark Ready to Send"}
            </button>
          )}

          {currentStatus === "pending_send" && (
            <button
              onClick={() => update({ status: "sent", brief_sent_at: new Date().toISOString() }, "sent")}
              disabled={loading !== null}
              className="btn-primary w-full justify-center text-xs"
            >
              {loading === "sent" ? "Updating…" : "Mark Brief Sent"}
            </button>
          )}

          {currentStatus === "sent" && (
            <>
              <button
                onClick={() => update({ status: "accepted", accepted_at: new Date().toISOString() }, "accept")}
                disabled={loading !== null}
                className="btn-primary w-full justify-center text-xs"
              >
                {loading === "accept" ? "Updating…" : "Mark Accepted"}
              </button>
              <button
                onClick={() => setDeclineModal(true)}
                disabled={loading !== null}
                className="w-full px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium hover:bg-red-100 transition-colors"
              >
                Mark Declined
              </button>
            </>
          )}

          {currentStatus === "accepted" && !invoiceAmount && (
            <button
              onClick={() => setInvoiceModal(true)}
              className="btn-secondary w-full justify-center text-xs"
            >
              Log Contractor Invoice
            </button>
          )}

          {currentStatus === "accepted" && invoiceAmount && !contractorPaid && (
            <button
              onClick={() => setPayModal(true)}
              className="btn-primary w-full justify-center text-xs"
            >
              Mark Contractor Paid
            </button>
          )}

          {contractorPaid && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700 font-medium text-center">
              Contractor paid ✓
            </div>
          )}

          <a
            href={`/jobs/${jobId}/brief`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full justify-center text-xs block text-center"
          >
            View Brief
          </a>
        </div>
      </div>

      {/* Decline modal */}
      <Modal open={declineModal} onClose={() => setDeclineModal(false)} title="Mark as Declined" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Reason (optional)</label>
            <textarea className="input min-h-[80px]" placeholder="Why did the contractor decline?" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeclineModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDecline} disabled={loading !== null} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
              {loading === "decline" ? "Saving…" : "Mark Declined"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Log invoice modal */}
      <Modal open={invoiceModal} onClose={() => setInvoiceModal(false)} title="Log Contractor Invoice" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Invoice Amount (CAD)</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={invoiceAmt} onChange={(e) => setInvoiceAmt(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setInvoiceModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleLogInvoice} disabled={loading !== null} className="btn-primary">
              {loading === "log_invoice" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pay modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Mark Contractor Paid" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="etransfer">E-Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="cheque">Cheque</option>
              <option value="direct_deposit">Direct Deposit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPayModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleMarkPaid} disabled={loading !== null} className="btn-primary">
              {loading === "pay" ? "Saving…" : "Mark Paid"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
