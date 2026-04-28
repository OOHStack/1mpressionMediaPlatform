"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignContractorFormProps {
  job: {
    id: string;
    campaign_name: string;
    job_number: string | null;
    city: string | null;
    job_type: string;
  };
  contractors: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    province: string | null;
    services: string[] | null;
    drone_capable: boolean;
    day_rate: number | null;
    reliability_rating: number | null;
  }[];
}

export default function AssignContractorForm({ job, contractors }: AssignContractorFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agreedRate, setAgreedRate] = useState("");
  const [rateUnit, setRateUnit] = useState("day");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggest contractors in the same city first
  const sorted = [...contractors].sort((a, b) => {
    const aMatch = a.city?.toLowerCase().includes(job.city?.toLowerCase() ?? "") ? -1 : 0;
    const bMatch = b.city?.toLowerCase().includes(job.city?.toLowerCase() ?? "") ? -1 : 0;
    return aMatch - bMatch;
  });

  async function handleAssign() {
    if (!selectedId) return;
    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from("assignments").insert({
      job_id: job.id,
      contractor_id: selectedId,
      status: "draft",
      agreed_rate: agreedRate ? parseFloat(agreedRate) : null,
      rate_unit: rateUnit || null,
      assignment_notes: notes || null,
    });

    if (err) { setError(err.message); setSaving(false); return; }

    // Update job status to assigned
    await supabase.from("jobs").update({ status: "assigned" }).eq("id", job.id);

    router.push(`/jobs/${job.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
        Selecting a contractor creates a draft assignment. You must separately send the brief — nothing is sent automatically.
      </div>

      {/* Contractor grid */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Select Contractor {job.city && <span className="normal-case font-normal text-gray-400">— showing {contractors.length} contractors, {job.city}-area suggested first</span>}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "text-left rounded-xl border p-4 transition-all",
                selectedId === c.id
                  ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{c.city ?? "—"}{c.province ? `, ${c.province}` : ""}</span>
                  </div>
                </div>
                {c.reliability_rating && (
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={cn("w-3 h-3", s <= c.reliability_rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-1.5 flex-wrap mt-2">
                {(c.services ?? []).slice(0, 3).map((s) => (
                  <span key={s} className="badge bg-gray-100 text-gray-600 text-xs capitalize">{s.replace(/_/g, " ")}</span>
                ))}
                {c.drone_capable && <span className="badge bg-blue-50 text-blue-700 text-xs">Drone</span>}
              </div>

              {c.day_rate && (
                <p className="text-xs text-gray-400 mt-2">${c.day_rate}/day</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedId && (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Assignment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Agreed Rate (CAD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="0.00"
                value={agreedRate}
                onChange={(e) => setAgreedRate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Rate Unit</label>
              <select className="input" value={rateUnit} onChange={(e) => setRateUnit(e.target.value)}>
                <option value="day">Per Day</option>
                <option value="half_day">Per Half Day</option>
                <option value="hour">Per Hour</option>
                <option value="location">Per Location</option>
                <option value="flat">Flat Fee</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Assignment Notes</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Internal notes about this assignment…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button
          type="button"
          onClick={handleAssign}
          disabled={!selectedId || saving}
          className="btn-primary"
        >
          {saving ? "Saving…" : "Create Assignment (Draft)"}
        </button>
      </div>
    </div>
  );
}
