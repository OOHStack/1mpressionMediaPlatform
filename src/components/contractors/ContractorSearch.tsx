"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractorSearchProps {
  currentQ?: string;
  currentCity?: string;
  currentDrone?: string;
}

export default function ContractorSearch({ currentQ, currentCity, currentDrone }: ContractorSearchProps) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (currentQ) params.set("q", currentQ);
    if (currentCity) params.set("city", currentCity);
    if (currentDrone) params.set("drone", currentDrone);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    const qs = params.toString();
    return pathname + (qs ? "?" + qs : "");
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search contractors…"
          defaultValue={currentQ}
          className="input pl-9 w-56"
          onChange={(e) => router.push(buildUrl({ q: e.target.value }))}
        />
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Filter by city…"
          defaultValue={currentCity}
          className="input pl-9 w-44"
          onChange={(e) => router.push(buildUrl({ city: e.target.value }))}
        />
      </div>
      <button
        onClick={() => router.push(buildUrl({ drone: currentDrone === "true" ? "" : "true" }))}
        className={cn(
          "px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
          currentDrone === "true"
            ? "bg-brand-600 text-white border-brand-600"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        )}
      >
        Drone Only
      </button>
    </div>
  );
}
