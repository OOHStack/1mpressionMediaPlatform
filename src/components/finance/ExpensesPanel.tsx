"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "contractor", label: "Contractor" },
  { value: "editing", label: "Editing" },
  { value: "travel", label: "Travel" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];

const CAT_COLORS: Record<string, string> = {
  contractor: "bg-blue-100 text-blue-700",
  editing: "bg-purple-100 text-purple-700",
  travel: "bg-orange-100 text-orange-700",
  equipment: "bg-gray-100 text-gray-700",
  other: "bg-yellow-100 text-yellow-700",
};

interface Expense {
  id: string;
  category: string | null;
  description: string | null;
  amount: number;
  paid_at: string | null;
  created_at: string;
}

interface ExpensesPanelProps {
  jobId: string;
  expenses: Expense[];
}

export default function ExpensesPanel({ jobId, expenses }: ExpensesPanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    category: "other",
    description: "",
    amount: "",
    paid_at: "",
  });

  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("expenses").insert({
      job_id: jobId,
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount) || 0,
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null,
    });
    setForm({ category: "other", description: "", amount: "", paid_at: "" });
    setAdding(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("expenses").delete().eq("id", id);
    router.refresh();
    setDeleting(null);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Additional Expenses
          {expenses.length > 0 && (
            <span className="ml-2 text-gray-400 font-normal">({formatCurrency(total)} total)</span>
          )}
        </h2>
        <button onClick={() => setAdding(!adding)} className="btn-secondary text-xs py-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Expense
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount (CAD)</label>
              <input type="number" step="0.01" min="0" required className="input" placeholder="0.00" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="What was this for?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Date Paid (optional)</label>
            <input type="date" className="input" value={form.paid_at} onChange={(e) => setForm((f) => ({ ...f, paid_at: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="btn-ghost text-xs">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-xs">{saving ? "Saving…" : "Add"}</button>
          </div>
        </form>
      )}

      {expenses.length === 0 && !adding ? (
        <p className="text-sm text-gray-400">No additional expenses logged.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div key={exp.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className={cn("badge shrink-0", CAT_COLORS[exp.category ?? "other"] ?? "bg-gray-100 text-gray-600")}>
                {exp.category ?? "other"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{exp.description ?? "—"}</p>
                {exp.paid_at && <p className="text-xs text-gray-400">{formatDate(exp.paid_at)}</p>}
              </div>
              <span className="font-medium text-sm text-gray-900">{formatCurrency(exp.amount)}</span>
              <button
                onClick={() => handleDelete(exp.id)}
                disabled={deleting === exp.id}
                className="btn-ghost p-1 text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {expenses.length > 0 && (
            <div className="flex justify-between text-sm font-semibold pt-2">
              <span>Expenses Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
