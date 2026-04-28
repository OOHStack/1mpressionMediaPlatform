"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "New", value: "new_request" },
  { label: "Needs Review", value: "needs_review" },
  { label: "Approved", value: "approved" },
  { label: "Needs Assignment", value: "needs_assignment" },
  { label: "Assigned", value: "assigned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Captured", value: "captured" },
  { label: "Delivered", value: "delivered" },
  { label: "Invoiced", value: "invoiced" },
  { label: "Paid", value: "paid" },
  { label: "Cancelled", value: "cancelled" },
];

interface JobFiltersProps {
  currentStatus?: string;
  currentCity?: string;
  currentQ?: string;
}

export default function JobFilters({ currentStatus, currentCity, currentQ }: JobFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (currentStatus) params.set("status", currentStatus);
    if (currentCity) params.set("city", currentCity);
    if (currentQ) params.set("q", currentQ);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    const qs = params.toString();
    return pathname + (qs ? "?" + qs : "");
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search campaigns…"
            defaultValue={currentQ}
            className="input pl-9"
            onChange={(e) => {
              const url = buildUrl({ q: e.target.value });
              router.push(url);
            }}
          />
        </div>
        {(currentStatus || currentCity || currentQ) && (
          <button
            onClick={() => router.push(pathname)}
            className="btn-ghost text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => router.push(buildUrl({ status: f.value }))}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              (currentStatus ?? "") === f.value
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
