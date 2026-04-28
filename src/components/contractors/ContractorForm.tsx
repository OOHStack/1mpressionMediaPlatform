"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";

const SERVICES = [
  "photography",
  "videography",
  "drone_photography",
  "drone_video",
  "monitoring",
  "posting_confirmation",
  "editing",
];

const PAYMENT_METHODS = [
  { value: "etransfer", label: "E-Transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "cheque", label: "Cheque" },
  { value: "direct_deposit", label: "Direct Deposit" },
  { value: "other", label: "Other" },
];

const PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

interface ContractorFormProps {
  initialData?: Record<string, any>;
  contractorId?: string;
}

export default function ContractorForm({ initialData, contractorId }: ContractorFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    city: initialData?.city ?? "",
    province: initialData?.province ?? "",
    drone_capable: initialData?.drone_capable ?? false,
    has_vehicle: initialData?.has_vehicle ?? false,
    day_rate: initialData?.day_rate ?? "",
    half_day_rate: initialData?.half_day_rate ?? "",
    hourly_rate: initialData?.hourly_rate ?? "",
    per_location_rate: initialData?.per_location_rate ?? "",
    preferred_payment: initialData?.preferred_payment ?? "etransfer",
    payment_email: initialData?.payment_email ?? "",
    notes: initialData?.notes ?? "",
    reliability_rating: initialData?.reliability_rating ?? "",
  });

  const [services, setServices] = useState<string[]>(initialData?.services ?? []);
  const [markets, setMarkets] = useState<string[]>(initialData?.markets ?? []);
  const [marketInput, setMarketInput] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(initialData?.portfolio_links ?? [""]);

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleService(s: string) {
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addMarket() {
    if (marketInput.trim()) {
      setMarkets((m) => [...m, marketInput.trim()]);
      setMarketInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      services,
      markets,
      portfolio_links: portfolioLinks.filter(Boolean),
      day_rate: form.day_rate ? parseFloat(form.day_rate) : null,
      half_day_rate: form.half_day_rate ? parseFloat(form.half_day_rate) : null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      per_location_rate: form.per_location_rate ? parseFloat(form.per_location_rate) : null,
      reliability_rating: form.reliability_rating ? parseInt(form.reliability_rating) : null,
    };

    if (contractorId) {
      const { error: err } = await supabase.from("contractors").update(payload).eq("id", contractorId);
      if (err) { setError(err.message); setSaving(false); return; }
      router.push(`/contractors/${contractorId}`);
    } else {
      const { data, error: err } = await supabase.from("contractors").insert(payload).select("id").single();
      if (err) { setError(err.message); setSaving(false); return; }
      router.push(`/contractors/${data.id}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Personal info */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Personal Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Full Name *</label>
            <input required className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" placeholder="Home base city" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="label">Province</label>
            <select className="input" value={form.province} onChange={(e) => set("province", e.target.value)}>
              <option value="">Select…</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Markets */}
        <div>
          <label className="label">Markets / Cities Covered</label>
          <div className="flex gap-2 mb-2">
            <input
              className="input flex-1"
              placeholder="Add a city or market…"
              value={marketInput}
              onChange={(e) => setMarketInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMarket(); }}}
            />
            <button type="button" onClick={addMarket} className="btn-secondary px-3">Add</button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {markets.map((m, i) => (
              <span key={i} className="badge bg-brand-50 text-brand-700 gap-1">
                {m}
                <button type="button" onClick={() => setMarkets((prev) => prev.filter((_, idx) => idx !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">Services & Capabilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {SERVICES.map((s) => (
            <label key={s} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${services.includes(s) ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}>
              <input
                type="checkbox"
                className="rounded"
                checked={services.includes(s)}
                onChange={() => toggleService(s)}
              />
              <span className="text-sm capitalize">{s.replace(/_/g, " ")}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.drone_capable} onChange={(e) => set("drone_capable", e.target.checked)} />
            <span className="text-sm text-gray-700">Drone Certified</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.has_vehicle} onChange={(e) => set("has_vehicle", e.target.checked)} />
            <span className="text-sm text-gray-700">Has Vehicle</span>
          </label>
        </div>
      </div>

      {/* Rates */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Rates (CAD)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Day Rate</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.day_rate} onChange={(e) => set("day_rate", e.target.value)} />
          </div>
          <div>
            <label className="label">Half Day</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.half_day_rate} onChange={(e) => set("half_day_rate", e.target.value)} />
          </div>
          <div>
            <label className="label">Hourly</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.hourly_rate} onChange={(e) => set("hourly_rate", e.target.value)} />
          </div>
          <div>
            <label className="label">Per Location</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.per_location_rate} onChange={(e) => set("per_location_rate", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Payment Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Preferred Payment Method</label>
            <select className="input" value={form.preferred_payment} onChange={(e) => set("preferred_payment", e.target.value)}>
              {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Payment Email / Account</label>
            <input type="email" className="input" placeholder="e-transfer or PayPal email" value={form.payment_email} onChange={(e) => set("payment_email", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Portfolio & Rating */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Portfolio & Notes</h3>
        <div>
          <label className="label">Portfolio Links</label>
          {portfolioLinks.map((link, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="url"
                className="input flex-1"
                placeholder="https://…"
                value={link}
                onChange={(e) => setPortfolioLinks((l) => l.map((x, idx) => idx === i ? e.target.value : x))}
              />
              {portfolioLinks.length > 1 && (
                <button type="button" onClick={() => setPortfolioLinks((l) => l.filter((_, idx) => idx !== i))} className="btn-ghost text-red-400 p-2">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setPortfolioLinks((l) => [...l, ""])} className="btn-ghost text-xs text-brand-600">
            <Plus className="w-3.5 h-3.5" /> Add Link
          </button>
        </div>
        <div>
          <label className="label">Reliability Rating (1–5)</label>
          <select className="input w-32" value={form.reliability_rating} onChange={(e) => set("reliability_rating", e.target.value)}>
            <option value="">—</option>
            {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Internal Notes</label>
          <textarea className="input min-h-[80px] resize-y" placeholder="Reliability history, special notes…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : contractorId ? "Save Changes" : "Add Contractor"}
        </button>
      </div>
    </form>
  );
}
