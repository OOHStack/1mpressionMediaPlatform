"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface JobFormProps {
  clients: { id: string; company: string }[];
  initialData?: Record<string, any>;
  jobId?: string;
}

const JOB_TYPES = [
  { value: "photography", label: "Photography" },
  { value: "videography", label: "Videography" },
  { value: "drone_photography", label: "Drone Photography" },
  { value: "drone_video", label: "Drone Video" },
  { value: "monitoring", label: "Monitoring" },
  { value: "posting_confirmation", label: "Posting Confirmation" },
  { value: "custom", label: "Custom" },
];

const JOB_STATUSES = [
  { value: "new_request", label: "New Request" },
  { value: "needs_review", label: "Needs Review" },
  { value: "quoted", label: "Quoted" },
  { value: "approved", label: "Approved" },
  { value: "needs_assignment", label: "Needs Assignment" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "captured", label: "Captured" },
  { value: "delivered", label: "Delivered" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function JobForm({ clients, initialData, jobId }: JobFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_id: initialData?.client_id ?? "",
    campaign_name: initialData?.campaign_name ?? "",
    market: initialData?.market ?? "",
    city: initialData?.city ?? "",
    province: initialData?.province ?? "",
    job_type: initialData?.job_type ?? "photography",
    status: initialData?.status ?? "new_request",
    shoot_date: initialData?.shoot_date ?? "",
    shoot_time: initialData?.shoot_time ?? "",
    delivery_deadline: initialData?.delivery_deadline ?? "",
    shoot_requirements: initialData?.shoot_requirements ?? "",
    deliverables_required: initialData?.deliverables_required ?? "",
    client_price: initialData?.client_price ?? "",
    contractor_budget: initialData?.contractor_budget ?? "",
    hst_applicable: initialData?.hst_applicable ?? true,
    internal_notes: initialData?.internal_notes ?? "",
  });

  const [locations, setLocations] = useState<
    { name: string; address: string; board_id: string; notes: string }[]
  >(
    initialData?.locations ?? [{ name: "", address: "", board_id: "", notes: "" }]
  );

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addLocation() {
    setLocations((l) => [...l, { name: "", address: "", board_id: "", notes: "" }]);
  }

  function removeLocation(i: number) {
    setLocations((l) => l.filter((_, idx) => idx !== i));
  }

  function updateLocation(i: number, field: string, value: string) {
    setLocations((l) =>
      l.map((loc, idx) => (idx === i ? { ...loc, [field]: value } : loc))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      client_id: form.client_id || null,
      client_price: form.client_price ? parseFloat(form.client_price) : null,
      contractor_budget: form.contractor_budget ? parseFloat(form.contractor_budget) : null,
      shoot_date: form.shoot_date || null,
      delivery_deadline: form.delivery_deadline || null,
    };

    let jobIdResult = jobId;

    if (jobId) {
      const { error: updateError } = await supabase
        .from("jobs")
        .update(payload)
        .eq("id", jobId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("jobs")
        .insert(payload)
        .select("id")
        .single();
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
      jobIdResult = data.id;
    }

    // Save locations
    if (jobIdResult) {
      if (jobId) {
        await supabase.from("job_locations").delete().eq("job_id", jobId);
      }
      const validLocations = locations.filter((l) => l.name || l.address || l.board_id);
      if (validLocations.length > 0) {
        await supabase.from("job_locations").insert(
          validLocations.map((l, i) => ({
            job_id: jobIdResult,
            name: l.name || null,
            address: l.address || null,
            board_id: l.board_id || null,
            notes: l.notes || null,
            sort_order: i,
          }))
        );
      }
    }

    router.push(`/jobs/${jobIdResult}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Core info */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Campaign Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Campaign Name *</label>
            <input
              required
              className="input"
              placeholder="e.g. Nike Spring 2025 — Toronto"
              value={form.campaign_name}
              onChange={(e) => set("campaign_name", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Client</label>
            <select
              className="input"
              value={form.client_id}
              onChange={(e) => set("client_id", e.target.value)}
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Job Type</label>
            <select
              className="input"
              value={form.job_type}
              onChange={(e) => set("job_type", e.target.value)}
            >
              {JOB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {JOB_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Market / Region</label>
            <input
              className="input"
              placeholder="e.g. Greater Toronto Area"
              value={form.market}
              onChange={(e) => set("market", e.target.value)}
            />
          </div>

          <div>
            <label className="label">City</label>
            <input
              className="input"
              placeholder="e.g. Toronto"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Province</label>
            <input
              className="input"
              placeholder="e.g. ON"
              value={form.province}
              onChange={(e) => set("province", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Shoot Date</label>
            <input
              type="date"
              className="input"
              value={form.shoot_date}
              onChange={(e) => set("shoot_date", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Shoot Time</label>
            <input
              type="time"
              className="input"
              value={form.shoot_time}
              onChange={(e) => set("shoot_time", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Delivery Deadline</label>
            <input
              type="date"
              className="input"
              value={form.delivery_deadline}
              onChange={(e) => set("delivery_deadline", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Financials */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Financials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Client Price (CAD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="0.00"
              value={form.client_price}
              onChange={(e) => set("client_price", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Contractor Budget (CAD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="0.00"
              value={form.contractor_budget}
              onChange={(e) => set("contractor_budget", e.target.value)}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={form.hst_applicable}
                onChange={(e) => set("hst_applicable", e.target.checked)}
              />
              <span className="text-sm text-gray-700">HST Applicable</span>
            </label>
          </div>
        </div>

        {form.client_price && form.contractor_budget && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
            <span className="text-gray-500">Estimated margin: </span>
            <span className="font-semibold text-gray-900">
              {(((parseFloat(form.client_price) - parseFloat(form.contractor_budget)) / parseFloat(form.client_price)) * 100).toFixed(0)}%
            </span>
            <span className="text-gray-400 ml-2">
              (${(parseFloat(form.client_price) - parseFloat(form.contractor_budget)).toFixed(2)} gross profit)
            </span>
          </div>
        )}
      </div>

      {/* Requirements */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Requirements
        </h3>
        <div>
          <label className="label">Shoot Requirements</label>
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="Describe what the photographer needs to capture…"
            value={form.shoot_requirements}
            onChange={(e) => set("shoot_requirements", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Deliverables Required</label>
          <textarea
            className="input min-h-[60px] resize-y"
            placeholder="e.g. 10 high-res JPEGs, 1 short video clip…"
            value={form.deliverables_required}
            onChange={(e) => set("deliverables_required", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Internal Notes</label>
          <textarea
            className="input min-h-[60px] resize-y"
            placeholder="Internal notes (not shown to contractors)…"
            value={form.internal_notes}
            onChange={(e) => set("internal_notes", e.target.value)}
          />
        </div>
      </div>

      {/* Locations */}
      <div className="card p-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Locations</h3>
          <button type="button" onClick={addLocation} className="btn-secondary text-xs py-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Location
          </button>
        </div>

        <div className="space-y-4">
          {locations.map((loc, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Location {i + 1}
                </span>
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLocation(i)}
                    className="btn-ghost text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Location Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Yonge & Dundas Billboard"
                    value={loc.name}
                    onChange={(e) => updateLocation(i, "name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Board / Screen ID</label>
                  <input
                    className="input"
                    placeholder="e.g. OOH-2847"
                    value={loc.board_id}
                    onChange={(e) => updateLocation(i, "board_id", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Address</label>
                  <input
                    className="input"
                    placeholder="Full address"
                    value={loc.address}
                    onChange={(e) => updateLocation(i, "address", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <input
                    className="input"
                    placeholder="Access notes, parking, special instructions…"
                    value={loc.notes}
                    onChange={(e) => updateLocation(i, "notes", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : jobId ? "Save Changes" : "Create Job"}
        </button>
      </div>
    </form>
  );
}
