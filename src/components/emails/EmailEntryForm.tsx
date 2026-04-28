"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EmailEntryForm() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    from_name: "",
    from_email: "",
    subject: "",
    body_text: "",
    received_at: new Date().toISOString().slice(0, 16),
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("email_intake")
      .insert({
        from_name: form.from_name || null,
        from_email: form.from_email || null,
        subject: form.subject || null,
        body_text: form.body_text || null,
        received_at: form.received_at ? new Date(form.received_at).toISOString() : null,
        status: "unread",
      })
      .select("id")
      .single();

    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/emails/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Sender Name</label>
          <input className="input" placeholder="First Last" value={form.from_name} onChange={(e) => set("from_name", e.target.value)} />
        </div>
        <div>
          <label className="label">Sender Email</label>
          <input type="email" className="input" placeholder="client@agency.com" value={form.from_email} onChange={(e) => set("from_email", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Subject</label>
        <input className="input" placeholder="Email subject line" value={form.subject} onChange={(e) => set("subject", e.target.value)} />
      </div>

      <div>
        <label className="label">Date Received</label>
        <input type="datetime-local" className="input" value={form.received_at} onChange={(e) => set("received_at", e.target.value)} />
      </div>

      <div>
        <label className="label">Message Body</label>
        <textarea
          className="input min-h-[160px] resize-y font-mono text-xs"
          placeholder="Paste the full email content here…"
          value={form.body_text}
          onChange={(e) => set("body_text", e.target.value)}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save Request"}</button>
      </div>
    </form>
  );
}
