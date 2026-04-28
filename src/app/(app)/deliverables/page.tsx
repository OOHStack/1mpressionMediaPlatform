import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Package } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import DeliverableStatusActions from "@/components/deliverables/DeliverableStatusActions";

export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  uploaded: "bg-blue-100 text-blue-700",
  reviewed: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  delivered: "bg-teal-100 text-teal-700",
};

const TYPE_COLORS: Record<string, string> = {
  raw: "bg-gray-100 text-gray-600",
  edited: "bg-purple-100 text-purple-700",
  final: "bg-green-100 text-green-700",
  reference: "bg-blue-100 text-blue-700",
  other: "bg-orange-100 text-orange-600",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function DeliverablesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("deliverables")
    .select("*, job:jobs(id, job_number, campaign_name, client:clients(company))")
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.status) query = query.eq("status", params.status);

  const { data: deliverables } = await query;

  const statusCounts: Record<string, number> = {};
  (deliverables ?? []).forEach((d: any) => {
    statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1;
  });

  const filters = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Uploaded", value: "uploaded" },
    { label: "Reviewed", value: "reviewed" },
    { label: "Approved", value: "approved" },
    { label: "Delivered", value: "delivered" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Deliverables" description="Review, approve, and deliver client files" />

      {/* Status filter pills */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/deliverables?status=${f.value}` : "/deliverables"}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              (params.status ?? "") === f.value
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {!deliverables || deliverables.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No deliverables yet"
            description="Files uploaded for jobs will appear here for review and delivery."
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {deliverables.map((d: any) => (
              <div key={d.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("badge", TYPE_COLORS[d.type ?? "other"] ?? "bg-gray-100 text-gray-600")}>
                      {d.type ?? "file"}
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate">{d.file_name ?? "Untitled file"}</p>
                  </div>

                  {d.job && (
                    <Link href={`/jobs/${d.job.id}`} className="text-xs text-brand-600 hover:text-brand-700 mt-0.5 block">
                      {d.job.job_number} · {d.job.campaign_name}
                      {d.job.client?.company && <span className="text-gray-400"> — {d.job.client.company}</span>}
                    </Link>
                  )}

                  {/* Links */}
                  <div className="flex gap-3 mt-1.5">
                    {d.drive_link && (
                      <a href={d.drive_link} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-brand-600 flex items-center gap-1">
                        📁 Google Drive ↗
                      </a>
                    )}
                    {d.dropbox_link && (
                      <a href={d.dropbox_link} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-brand-600">
                        📦 Dropbox ↗
                      </a>
                    )}
                    {d.file_url && !d.drive_link && !d.dropbox_link && (
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-brand-600">
                        🔗 View file ↗
                      </a>
                    )}
                  </div>

                  {d.revision_notes && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-1.5 border border-amber-100">
                      Note: {d.revision_notes}
                    </p>
                  )}
                </div>

                {/* Status + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={cn("badge", STATUS_COLORS[d.status] ?? "bg-gray-100 text-gray-600")}>
                    {d.status}
                  </span>
                  {d.client_delivery_date && (
                    <span className="text-xs text-gray-400">Deliver by {formatDate(d.client_delivery_date)}</span>
                  )}
                  {d.delivered_at && (
                    <span className="text-xs text-teal-600">Delivered {formatDate(d.delivered_at)}</span>
                  )}
                  <DeliverableStatusActions deliverableId={d.id} currentStatus={d.status} jobId={d.job_id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
