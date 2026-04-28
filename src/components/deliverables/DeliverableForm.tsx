"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DeliverableFormProps {
  jobId: string;
}

export default function DeliverableForm({ jobId }: DeliverableFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "final",
    file_name: "",
    drive_link: "",
    dropbox_link: "",
    file_url: "",
    status: "uploaded",
    client_delivery_date: "",
    revision_notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from("deliverables").insert({
      job_id: jobId,
      type: form.type,
      file_name: form.file_name || null,
      drive_link: form.drive_link || null,
      dropbox_link: form.dropbox_link || null,
      file_url: form.file_url || null,
      status: form.status,
      client_delivery_date: form.client_delivery_date || null,
      revision_notes: form.revision_notes || null,
    });

    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/jobs/${jobId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">File Type</label>
          <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="final">Final</option>
            <option value="edited">Edited</option>
            <option value="raw">RAW</option>
            <option value="reference">Reference</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="pending">Pending</option>
            <option value="uploaded">Uploaded</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">File Name</label>
        <input className="input" placeholder="campaign_toronto_001.jpg" value={form.file_name} onChange={(e) => set("file_name", e.target.value)} />
      </div>

      <div>
        <label className="label">Google Drive Link</label>
        <input type="url" className="input" placeholder="https://drive.google.com/…" value={form.drive_link} onChange={(e) => set("drive_link", e.target.value)} />
      </div>

      <div>
        <label className="label">Dropbox Link</label>
        <input type="url" className="input" placeholder="https://dropbox.com/…" value={form.dropbox_link} onChange={(e) => set("dropbox_link", e.target.value)} />
      </div>

      <div>
        <label className="label">Client Delivery Date</label>
        <input type="date" className="input" value={form.client_delivery_date} onChange={(e) => set("client_delivery_date", e.target.value)} />
      </div>

      <div>
        <label className="label">Revision Notes</label>
        <textarea className="input min-h-[60px]" placeholder="Any notes about this file or revisions needed…" value={form.revision_notes} onChange={(e) => set("revision_notes", e.target.value)} />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Add Deliverable"}</button>
      </div>
    </form>
  );
}
