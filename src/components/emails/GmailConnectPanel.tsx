"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface GmailConnectPanelProps {
  isConnected: boolean;
  lastSync: string | null;
}

export default function GmailConnectPanel({ isConnected, lastSync }: GmailConnectPanelProps) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Disconnect Gmail? This will stop email sync. Existing emails are not deleted.")) return;
    setDisconnecting(true);
    await fetch("/api/gmail/disconnect", { method: "POST" });
    router.refresh();
    setDisconnecting(false);
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Not connected</span>
        </div>
        <a href="/api/gmail/auth" className="btn-primary text-xs">
          Connect Gmail
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-700 font-medium">Gmail connected</span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-xs text-red-500 hover:text-red-700 font-medium"
        >
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
      {lastSync && (
        <p className="text-xs text-gray-400">
          Last synced: {new Date(lastSync).toLocaleString("en-CA")}
        </p>
      )}
    </div>
  );
}
