import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Mail, Plus, Settings } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getStoredTokens, getLastSyncTime } from "@/lib/gmail";
import EmailSyncButton from "@/components/emails/EmailSyncButton";

export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  converted: "bg-green-100 text-green-700",
  ignored: "bg-gray-100 text-gray-500",
  spam: "bg-red-100 text-red-600",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function EmailsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const tokens = await getStoredTokens();
  const lastSync = await getLastSyncTime();
  const isConnected = !!tokens;
  const hasAiKey = !!process.env.ANTHROPIC_API_KEY;

  let query = supabase
    .from("email_intake")
    .select("*")
    .order("received_at", { ascending: false, nullsFirst: false })
    .limit(100);

  if (params.status) query = query.eq("status", params.status);

  const { data: emails } = await query;

  const counts: Record<string, number> = {};
  (emails ?? []).forEach((e: any) => { counts[e.status] = (counts[e.status] ?? 0) + 1; });
  const unreadCount = counts.unread ?? 0;

  const filters = [
    { label: "All", value: "" },
    { label: "Unread", value: "unread" },
    { label: "Reviewing", value: "reviewing" },
    { label: "Converted", value: "converted" },
    { label: "Ignored", value: "ignored" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Email Intake"
        description={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        actions={
          <div className="flex items-center gap-2">
            {isConnected && <EmailSyncButton />}
            <Link href="/emails/settings" className="btn-secondary text-xs">
              <Settings className="w-3.5 h-3.5" /> Settings
            </Link>
            <Link href="/emails/new" className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Manual Entry
            </Link>
          </div>
        }
      />

      {/* Connection status bar */}
      <div className={cn(
        "rounded-lg border px-4 py-3 mb-5 flex items-center justify-between text-sm",
        isConnected ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-amber-400")} />
          {isConnected ? (
            <span className="text-green-800">
              Gmail connected
              {lastSync && <span className="text-green-600 font-normal"> · Last synced {new Date(lastSync).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
            </span>
          ) : (
            <span className="text-amber-800">Gmail not connected — emails won&apos;t sync automatically</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!hasAiKey && (
            <span className="text-xs text-amber-600">AI extraction requires ANTHROPIC_API_KEY</span>
          )}
          <Link href="/emails/settings" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            {isConnected ? "Manage" : "Connect Gmail →"}
          </Link>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/emails?status=${f.value}` : "/emails"}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              (params.status ?? "") === f.value
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
            {f.value === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-xs">{unreadCount}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {!emails || emails.length === 0 ? (
          <EmptyState
            icon={Mail}
            title={isConnected ? "No emails yet — sync to load your inbox" : "No emails yet"}
            description={isConnected ? "Click Sync Now to fetch recent emails from Gmail." : "Connect Gmail in Settings to enable automatic email sync."}
            action={
              isConnected
                ? <EmailSyncButton variant="primary" />
                : <Link href="/emails/settings" className="btn-primary">Connect Gmail</Link>
            }
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {emails.map((email: any) => (
              <Link
                key={email.id}
                href={`/emails/${email.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                {/* Unread dot */}
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                  email.status === "unread" ? "bg-blue-500" : "bg-transparent"
                )} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm truncate",
                      email.status === "unread" ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                    )}>
                      {email.from_name ?? email.from_email ?? "Unknown sender"}
                    </p>
                    {email.from_email && email.from_name && (
                      <span className="text-xs text-gray-400 hidden md:block truncate">
                        &lt;{email.from_email}&gt;
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm mt-0.5 truncate",
                    email.status === "unread" ? "text-gray-800" : "text-gray-600"
                  )}>
                    {email.subject ?? "(no subject)"}
                  </p>
                  {email.ai_summary ? (
                    <p className="text-xs text-brand-600 mt-0.5 truncate">
                      ✦ {email.ai_summary}
                    </p>
                  ) : email.body_text ? (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {email.body_text.slice(0, 120)}
                    </p>
                  ) : null}
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={cn("badge", STATUS_COLORS[email.status] ?? "bg-gray-100 text-gray-600")}>
                    {email.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(email.received_at ?? email.created_at)}
                  </span>
                  {email.ai_confidence != null && (
                    <span className="text-xs text-gray-400">
                      {Math.round(email.ai_confidence * 100)}% match
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
