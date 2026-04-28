import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Mail, Plus } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  converted: "bg-green-100 text-green-700",
  ignored: "bg-gray-100 text-gray-500",
  spam: "bg-red-100 text-red-600",
};

export default async function EmailsPage() {
  const supabase = await createClient();

  const { data: emails } = await supabase
    .from("email_intake")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Email Intake"
        description="Incoming client requests from Gmail"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary text-xs" disabled>
              Sync Gmail (Phase 3)
            </button>
            <Link href="/emails/new" className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Manual Entry
            </Link>
          </div>
        }
      />

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-5 text-sm text-amber-800">
        Gmail OAuth integration is coming in Phase 3. You can manually log incoming requests below.
      </div>

      <div className="card overflow-hidden">
        {!emails || emails.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No emails yet"
            description="Gmail sync coming in Phase 3. Add requests manually for now."
            action={<Link href="/emails/new" className="btn-primary"><Plus className="w-4 h-4" /> Add Manual Request</Link>}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {emails.map((email: any) => (
              <Link
                key={email.id}
                href={`/emails/${email.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors block"
              >
                <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", email.status === "unread" ? "bg-blue-500" : "bg-gray-200")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{email.from_name ?? email.from_email ?? "Unknown sender"}</p>
                    {email.from_email && email.from_name && (
                      <span className="text-xs text-gray-400">&lt;{email.from_email}&gt;</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 truncate">{email.subject ?? "(no subject)"}</p>
                  {email.ai_summary && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{email.ai_summary}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={cn("badge", STATUS_COLORS[email.status] ?? "bg-gray-100 text-gray-600")}>
                    {email.status}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(email.received_at ?? email.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
