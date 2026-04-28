import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { Package } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  uploaded: "bg-blue-100 text-blue-700",
  reviewed: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  delivered: "bg-teal-100 text-teal-700",
};

export default async function DeliverablesPage() {
  const supabase = await createClient();

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*, job:jobs(id, job_number, campaign_name, client:clients(company))")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Deliverables" description="All uploaded and delivered files" />

      <div className="card overflow-hidden">
        {!deliverables || deliverables.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No deliverables yet"
            description="Files uploaded for jobs will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">File</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deliverables.map((d: any) => (
                  <tr key={d.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-xs">{d.file_name ?? d.type ?? "—"}</p>
                      {(d.drive_link || d.dropbox_link || d.file_url) && (
                        <a
                          href={d.drive_link ?? d.dropbox_link ?? d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:text-brand-700"
                        >
                          View ↗
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {d.job ? (
                        <Link href={`/jobs/${d.job.id}`} className="text-brand-600 hover:text-brand-700 truncate block max-w-[200px]">
                          {d.job.job_number} · {d.job.campaign_name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {d.job?.client?.company ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge", STATUS_COLORS[d.status] ?? "bg-gray-100 text-gray-600")}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {formatDate(d.delivered_at ?? d.client_delivery_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
