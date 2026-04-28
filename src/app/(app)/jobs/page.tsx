import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, JOB_TYPE_LABELS } from "@/lib/utils";
import { Briefcase } from "lucide-react";
import JobFilters from "@/components/jobs/JobFilters";
import type { Job, JobStatus } from "@/types";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ status?: string; city?: string; q?: string }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*, client:clients(company)")
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }
  if (params.q) {
    query = query.ilike("campaign_name", `%${params.q}%`);
  }

  const { data: jobs } = await query;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Jobs"
        description={`${jobs?.length ?? 0} total jobs`}
        actions={
          <Link href="/jobs/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        }
      />

      <JobFilters currentStatus={params.status} currentCity={params.city} currentQ={params.q} />

      <div className="card overflow-hidden mt-4">
        {!jobs || jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description="Create your first job or adjust filters."
            action={
              <Link href="/jobs/new" className="btn-primary">
                <Plus className="w-4 h-4" /> New Job
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">Job #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Campaign</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">City</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden xl:table-cell">Deadline</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 hidden xl:table-cell">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job: any) => (
                  <tr key={job.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${job.id}`} className="text-brand-600 font-medium hover:text-brand-700">
                        {job.job_number ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-gray-900 hover:text-brand-600 block truncate max-w-xs">
                        {job.campaign_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[140px]">
                      {job.client?.company ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {JOB_TYPE_LABELS[job.job_type as keyof typeof JOB_TYPE_LABELS] ?? job.job_type}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {job.city ?? job.market ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden xl:table-cell">
                      {formatDate(job.delivery_deadline)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium hidden xl:table-cell">
                      {formatCurrency(job.client_price)}
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
