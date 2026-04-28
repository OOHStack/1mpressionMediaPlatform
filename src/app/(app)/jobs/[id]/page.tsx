import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit, MapPin, DollarSign, Calendar, User, Package, FileText } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate, JOB_TYPE_LABELS, profitMargin, formatMargin } from "@/lib/utils";
import { cn } from "@/lib/utils";
import JobStatusActions from "@/components/jobs/JobStatusActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: job },
    { data: locations },
    { data: assignments },
    { data: deliverables },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, client:clients(id, company, email, phone)")
      .eq("id", id)
      .single(),
    supabase.from("job_locations").select("*").eq("job_id", id).order("sort_order"),
    supabase
      .from("assignments")
      .select("*, contractor:contractors(id, name, email, phone, city)")
      .eq("job_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("deliverables").select("*").eq("job_id", id).order("created_at", { ascending: false }),
  ]);

  if (!job) notFound();

  const margin = profitMargin(job.client_price, job.contractor_budget);
  const isLowMargin = margin !== null && margin < 30;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link href="/jobs" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Jobs
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-gray-900">{job.campaign_name}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-gray-500">
            {job.job_number} · {JOB_TYPE_LABELS[job.job_type as keyof typeof JOB_TYPE_LABELS]} · {job.city ?? job.market ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/jobs/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Edit
          </Link>
        </div>
      </div>

      {/* Status action bar */}
      <JobStatusActions jobId={id} currentStatus={job.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Left col — main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Details card */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Job Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Client</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {job.client ? (
                    <Link href={`/clients/${job.client.id}`} className="text-brand-600 hover:text-brand-700">
                      {job.client.company}
                    </Link>
                  ) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Job Type</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {JOB_TYPE_LABELS[job.job_type as keyof typeof JOB_TYPE_LABELS] ?? job.job_type}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Shoot Date</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {formatDate(job.shoot_date)}{job.shoot_time ? ` · ${job.shoot_time}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Delivery Deadline</dt>
                <dd className={cn("font-medium mt-0.5", job.delivery_deadline ? "text-gray-900" : "text-gray-400")}>
                  {formatDate(job.delivery_deadline)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">City / Market</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{job.city ?? job.market ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Province</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{job.province ?? "—"}</dd>
              </div>
            </dl>

            {job.shoot_requirements && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Shoot Requirements</dt>
                <dd className="text-sm text-gray-700 whitespace-pre-wrap">{job.shoot_requirements}</dd>
              </div>
            )}

            {job.deliverables_required && (
              <div className="mt-3">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Deliverables Required</dt>
                <dd className="text-sm text-gray-700 whitespace-pre-wrap">{job.deliverables_required}</dd>
              </div>
            )}

            {job.internal_notes && (
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3">
                <dt className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Internal Notes</dt>
                <dd className="text-sm text-amber-900">{job.internal_notes}</dd>
              </div>
            )}
          </div>

          {/* Locations */}
          {locations && locations.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> Locations ({locations.length})
              </h2>
              <div className="space-y-3">
                {locations.map((loc: any, i: number) => (
                  <div key={loc.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {loc.name ?? `Location ${i + 1}`}
                        </p>
                        {loc.address && (
                          <p className="text-xs text-gray-500 mt-0.5">{loc.address}</p>
                        )}
                        {loc.board_id && (
                          <p className="text-xs text-gray-400 mt-0.5">ID: {loc.board_id}</p>
                        )}
                        {loc.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">{loc.notes}</p>
                        )}
                      </div>
                      {loc.address && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(loc.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium ml-3 shrink-0"
                        >
                          Maps ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> Assignment
              </h2>
              <Link href={`/jobs/${id}/assign`} className="btn-secondary text-xs py-1.5">
                {assignments && assignments.length > 0 ? "Reassign" : "Assign Contractor"}
              </Link>
            </div>

            {!assignments || assignments.length === 0 ? (
              <p className="text-sm text-gray-400">No contractor assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a: any) => (
                  <div key={a.id} className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {a.contractor ? (
                            <Link href={`/contractors/${a.contractor.id}`} className="text-brand-600 hover:text-brand-700">
                              {a.contractor.name}
                            </Link>
                          ) : "Unknown contractor"}
                        </p>
                        {a.contractor?.city && (
                          <p className="text-xs text-gray-400">{a.contractor.city}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "badge",
                          a.status === "accepted" || a.status === "completed" ? "bg-green-100 text-green-800" :
                          a.status === "declined" ? "bg-red-100 text-red-700" :
                          a.status === "sent" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {a.status}
                        </span>
                        <Link href={`/jobs/${id}/assignment/${a.id}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                          Manage →
                        </Link>
                      </div>
                    </div>
                    {a.agreed_rate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Rate: {formatCurrency(a.agreed_rate)} / {a.rate_unit ?? "flat"}
                      </p>
                    )}
                    {a.contractor_paid_at && (
                      <p className="text-xs text-green-600 mt-1">Paid {formatDate(a.contractor_paid_at)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deliverables */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" /> Deliverables
              </h2>
              <div className="flex gap-2">
                <Link href="/deliverables" className="text-xs text-brand-600 hover:text-brand-700 font-medium py-1.5">View all</Link>
                <Link href={`/jobs/${id}/deliverables/new`} className="btn-secondary text-xs py-1.5">+ Add</Link>
              </div>
            </div>

            {!deliverables || deliverables.length === 0 ? (
              <p className="text-sm text-gray-400">No deliverables uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {deliverables.map((d: any) => (
                  <div key={d.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.file_name ?? d.type ?? "File"}</p>
                      {(d.drive_link || d.dropbox_link || d.file_url) && (
                        <a
                          href={d.drive_link ?? d.dropbox_link ?? d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:text-brand-700"
                        >
                          View file ↗
                        </a>
                      )}
                      {d.revision_notes && (
                        <p className="text-xs text-amber-700 mt-1">{d.revision_notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn(
                        "badge",
                        d.status === "approved" || d.status === "delivered" ? "bg-green-100 text-green-800" :
                        d.status === "uploaded" ? "bg-blue-100 text-blue-700" :
                        d.status === "rejected" ? "bg-red-100 text-red-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col — finance sidebar */}
        <div className="space-y-5">
          {/* Finance card */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" /> Financials
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Client Price</dt>
                <dd className="font-semibold text-gray-900">{formatCurrency(job.client_price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Contractor Budget</dt>
                <dd className="font-medium text-gray-700">{formatCurrency(job.contractor_budget)}</dd>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <dt className="text-gray-500">Gross Profit</dt>
                <dd className="font-semibold text-gray-900">
                  {job.client_price && job.contractor_budget
                    ? formatCurrency(job.client_price - job.contractor_budget)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Margin</dt>
                <dd className={cn(
                  "font-bold text-base",
                  isLowMargin ? "text-red-600" : "text-green-600"
                )}>
                  {formatMargin(margin)}
                  {isLowMargin && <span className="text-xs ml-1 font-medium text-red-500">LOW</span>}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">HST</dt>
                <dd className="text-gray-700">{job.hst_applicable ? "Applicable" : "Not applicable"}</dd>
              </div>
            </dl>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href={`/jobs/${id}/invoice/new`} className="btn-primary w-full justify-center text-xs">
                Create Invoice
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link href={`/jobs/${id}/brief`} className="btn-secondary w-full justify-center text-xs">
                Generate Brief
              </Link>
              <Link href={`/jobs/${id}/assign`} className="btn-secondary w-full justify-center text-xs">
                Assign Contractor
              </Link>
              <Link href={`/jobs/${id}/expenses`} className="btn-secondary w-full justify-center text-xs">
                Expenses &amp; Profitability
              </Link>
              <Link href={`/jobs/${id}/edit`} className="btn-secondary w-full justify-center text-xs">
                Edit Job
              </Link>
            </div>
          </div>

          {/* Meta */}
          <div className="card p-4">
            <dl className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <dt>Created</dt>
                <dd>{formatDate(job.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Updated</dt>
                <dd>{formatDate(job.updated_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Source</dt>
                <dd className="capitalize">{job.source ?? "manual"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
