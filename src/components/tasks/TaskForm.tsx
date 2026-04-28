"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TASK_TYPES = [
  { value: "follow_up_client", label: "Follow up with client" },
  { value: "assign_contractor", label: "Assign contractor" },
  { value: "shoot_due", label: "Shoot due" },
  { value: "deliver_files", label: "Deliver files" },
  { value: "send_invoice", label: "Send invoice" },
  { value: "pay_contractor", label: "Pay contractor" },
  { value: "follow_up_invoice", label: "Follow up on unpaid invoice" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

interface TaskFormProps {
  jobs: { id: string; job_number: string | null; campaign_name: string }[];
}

export default function TaskForm({ jobs }: TaskFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "other",
    priority: "medium",
    due_date: "",
    job_id: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from("tasks").insert({
      ...form,
      job_id: form.job_id || null,
      due_date: form.due_date || null,
    });

    if (err) { setError(err.message); setSaving(false); return; }
    router.push("/tasks");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div>
        <label className="label">Title *</label>
        <input required className="input" placeholder="What needs to be done?" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
            {TASK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Due Date</label>
        <input type="date" className="input" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
      </div>

      <div>
        <label className="label">Related Job (optional)</label>
        <select className="input" value={form.job_id} onChange={(e) => set("job_id", e.target.value)}>
          <option value="">No job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.job_number} · {j.campaign_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[80px]" placeholder="Additional details…" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Create Task"}</button>
      </div>
    </form>
  );
}
