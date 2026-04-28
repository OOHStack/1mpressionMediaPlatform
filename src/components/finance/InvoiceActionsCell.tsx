"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

interface InvoiceActionsCellProps {
  invoiceId: string;
  currentStatus: string;
}

export default function InvoiceActionsCell({ invoiceId, currentStatus }: InvoiceActionsCellProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [payModal, setPayModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMethod, setPayMethod] = useState("etransfer");

  async function update(fields: Record<string, unknown>, key: string) {
    setLoading(key);
    await supabase.from("invoices").update(fields).eq("id", invoiceId);
    router.refresh();
    setLoading(null);
  }

  async function handleMarkPaid() {
    setLoading("pay");
    const paid = parseFloat(amountPaid) || 0;
    await supabase.from("invoices").update({
      status: "paid",
      amount_paid: paid,
      paid_date: paidDate,
      payment_method: payMethod,
    }).eq("id", invoiceId);

    // Log payment
    await supabase.from("payments").insert({
      invoice_id: invoiceId,
      amount: paid,
      payment_date: paidDate,
      payment_method: payMethod,
    });

    router.refresh();
    setLoading(null);
    setPayModal(false);
  }

  if (currentStatus === "paid" || currentStatus === "cancelled") {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <>
      <div className="flex gap-1 justify-end flex-wrap">
        {currentStatus === "draft" && (
          <button
            onClick={() => update({ status: "sent", issue_date: new Date().toISOString().split("T")[0] }, "send")}
            disabled={loading !== null}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium px-1.5 py-1 rounded hover:bg-brand-50"
          >
            {loading === "send" ? "…" : "Mark Sent"}
          </button>
        )}
        {["sent", "viewed", "partial", "overdue"].includes(currentStatus) && (
          <button
            onClick={() => setPayModal(true)}
            className="text-xs text-green-700 hover:text-green-800 font-medium px-1.5 py-1 rounded hover:bg-green-50"
          >
            Mark Paid
          </button>
        )}
        {currentStatus === "sent" && (
          <button
            onClick={() => update({ status: "overdue" }, "overdue")}
            disabled={loading !== null}
            className="text-xs text-red-600 hover:text-red-700 font-medium px-1.5 py-1 rounded hover:bg-red-50"
          >
            {loading === "overdue" ? "…" : "Overdue"}
          </button>
        )}
      </div>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Amount Paid (CAD)</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" className="input" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="etransfer">E-Transfer</option>
              <option value="wire">Wire Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="credit_card">Credit Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPayModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleMarkPaid} disabled={loading !== null || !amountPaid} className="btn-primary">
              {loading === "pay" ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
