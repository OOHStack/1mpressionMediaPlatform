"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { label: "All", value: "" },
  { label: "Agency", value: "agency" },
  { label: "Brand", value: "brand" },
  { label: "Vendor", value: "vendor" },
  { label: "Partner", value: "partner" },
  { label: "Other", value: "other" },
];

interface ClientSearchProps {
  currentQ?: string;
  currentType?: string;
}

export default function ClientSearch({ currentQ, currentType }: ClientSearchProps) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (currentQ) params.set("q", currentQ);
    if (currentType) params.set("type", currentType);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    const qs = params.toString();
    return pathname + (qs ? "?" + qs : "");
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search clients…"
          defaultValue={currentQ}
          className="input pl-9"
          onChange={(e) => router.push(buildUrl({ q: e.target.value }))}
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => router.push(buildUrl({ type: t.value }))}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              (currentType ?? "") === t.value
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
