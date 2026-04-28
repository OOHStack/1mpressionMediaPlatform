"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailSyncButtonProps {
  variant?: "primary" | "secondary";
}

export default function EmailSyncButton({ variant = "secondary" }: EmailSyncButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: json.error ?? "Sync failed" });
      } else {
        const count = json.synced ?? 0;
        setResult({ ok: true, message: count === 0 ? "Up to date" : `${count} new email${count === 1 ? "" : "s"}` });
        router.refresh();
      }
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={cn(variant === "primary" ? "btn-primary" : "btn-secondary", "text-xs")}
      >
        <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
        {syncing ? "Syncing…" : "Sync Now"}
      </button>
      {result && (
        <span className={cn("flex items-center gap-1 text-xs", result.ok ? "text-green-600" : "text-red-500")}>
          {result.ok
            ? <CheckCircle className="w-3.5 h-3.5" />
            : <AlertCircle className="w-3.5 h-3.5" />}
          {result.message}
        </span>
      )}
    </div>
  );
}
