"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const HST_RATE = 0.13;

interface CreateInvoiceFormProps {
  job: {
    id: string;
    client_id: string | null;
    client_price: number | null;
    hst_applicable: boolean;
    client?: { id: string; company: string } | null;
  };
}

export default function CreateInvoiceForm({ job }: CreateInvoiceFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    subtotal: job.client_price?.toString() ?? "",
    hst: job.hst_applicable ? ((job.client_price ?? 0) * HST_RATE).toFixed(2) : "0",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    notes: "",
  });

  const total = (parseFloat(form.subtotal) || 0) + (parseFloat(form.hst) || 0);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("invoices")
      .insert({
        job_id: job.id,
        client_id: job.client_id,
        type: "client",
        status: "draft",
        subtotal: parseFloat(form.subtotal) || 0,
        hst_amount: parseFloat(form.hst) || 0,
        total_amount: total,
        amount_paid: 0,
        issue_date: form.issue_date,
        due_date: form.due_date,
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (err) { setError(err.message); setSaving(false); return; }

    // Move job to invoiced
    await supabase.from("jobs").update({ status: "invoiced" }).eq("id", job.id);

    router.push(`/finance`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div>
        <label className="label">Client</label>
        <p className="text-sm font-medium text-gray-900 py-2">{job.client?.company ?? "—"}</p>
      </div>

      <div>
        <label className="label">Subtotal (CAD)</label>
        <input type="number" step="0.01" min="0" required className="input" value={form.subtotal} onChange={(e) => {
          const sub = parseFloat(e.target.value) || 0;
          setForm((f) => ({ ...f, subtotal: e.target.value, hst: job.hst_applicable ? (sub * HST_RATE).toFixed(2) : "0" }));
        }} />
      </div>

      <div>
        <label className="label">HST (13%)</label>
        <input type="number" step="0.01" min="0" className="input" value={form.hst} onChange={(e) => set("hst", e.target.value)} />
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total</span>
          <span className="font-bold text-gray-900">${total.toFixed(2)} CAD</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Issue Date</label>
          <input type="date" className="input" value={form.issue_date} onChange={(e) => set("issue_date", e.target.value)} />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input min-h-[60px]" placeholder="Payment instructions, PO numbers…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Creating…" : "Create Invoice (Draft)"}</button>
      </div>
    </form>
  );
}
