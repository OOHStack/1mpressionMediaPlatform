"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ClientFormProps {
  initialData?: Record<string, any>;
  clientId?: string;
}

const CLIENT_TYPES = [
  { value: "agency", label: "Agency" },
  { value: "brand", label: "Brand" },
  { value: "vendor", label: "Vendor" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

export default function ClientForm({ initialData, clientId }: ClientFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company: initialData?.company ?? "",
    contact_name: initialData?.contact_name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    type: initialData?.type ?? "agency",
    billing_name: initialData?.billing_name ?? "",
    billing_email: initialData?.billing_email ?? "",
    billing_address: initialData?.billing_address ?? "",
    notes: initialData?.notes ?? "",
    preferred_workflow: initialData?.preferred_workflow ?? "",
    special_instructions: initialData?.special_instructions ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (clientId) {
      const { error: err } = await supabase.from("clients").update(form).eq("id", clientId);
      if (err) { setError(err.message); setSaving(false); return; }
      router.push(`/clients/${clientId}`);
    } else {
      const { data, error: err } = await supabase.from("clients").insert(form).select("id").single();
      if (err) { setError(err.message); setSaving(false); return; }
      router.push(`/clients/${data.id}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Company Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Company Name *</label>
            <input required className="input" placeholder="e.g. Dentsu Creative" value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div>
            <label className="label">Primary Contact Name</label>
            <input className="input" placeholder="First Last" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
              {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="contact@company.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input" placeholder="+1 (416) 000-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Billing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Billing Name</label>
            <input className="input" placeholder="Legal entity name" value={form.billing_name} onChange={(e) => set("billing_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Billing Email</label>
            <input type="email" className="input" placeholder="accounts@company.com" value={form.billing_email} onChange={(e) => set("billing_email", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Billing Address</label>
            <textarea className="input min-h-[60px]" placeholder="Full billing address" value={form.billing_address} onChange={(e) => set("billing_address", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Notes & Preferences</h3>
        <div>
          <label className="label">Preferred Workflow</label>
          <textarea className="input min-h-[60px]" placeholder="e.g. Always CC Jenny, send files via Dropbox…" value={form.preferred_workflow} onChange={(e) => set("preferred_workflow", e.target.value)} />
        </div>
        <div>
          <label className="label">Special Instructions</label>
          <textarea className="input min-h-[60px]" placeholder="e.g. Watermark required, specific naming conventions…" value={form.special_instructions} onChange={(e) => set("special_instructions", e.target.value)} />
        </div>
        <div>
          <label className="label">Internal Notes</label>
          <textarea className="input min-h-[60px]" placeholder="Internal notes only" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : clientId ? "Save Changes" : "Create Client"}</button>
      </div>
    </form>
  );
}
