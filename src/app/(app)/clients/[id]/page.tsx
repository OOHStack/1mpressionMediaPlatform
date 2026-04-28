import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit, Building2, Mail, Phone, Briefcase } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate, JOB_STATUS_COLORS, JOB_STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

const TYPE_COLORS: Record<string, string> = {
  agency: "bg-blue-100 text-blue-700",
  vendor: "bg-purple-100 text-purple-700",
  brand: "bg-green-100 text-green-700",
  partner: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-600",
};

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: jobs }, { data: contacts }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("jobs").select("id, job_number, campaign_name, status, shoot_date, delivery_deadline, client_price, city").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("contacts").select("*").eq("client_id", id).order("is_primary", { ascending: false }),
  ]);

  if (!client) notFound();

  const totalRevenue = (jobs ?? []).reduce((sum: number, j: any) => sum + (j.client_price ?? 0), 0);
  const activeJobs = (jobs ?? []).filter((j: any) => !["closed", "cancelled", "paid"].includes(j.status));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link href="/clients" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Clients
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{client.company}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("badge capitalize", TYPE_COLORS[client.type] ?? "bg-gray-100 text-gray-600")}>{client.type}</span>
              {!client.is_active && <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/jobs/new?client=${id}`} className="btn-primary text-xs">+ New Job</Link>
          <Link href={`/clients/${id}/edit`} className="btn-secondary text-xs">
            <Edit className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Jobs */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" /> Jobs ({jobs?.length ?? 0})
              </h2>
              <Link href={`/jobs?client=${id}`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">View all</Link>
            </div>
            {!jobs || jobs.length === 0 ? (
              <p className="text-sm text-gray-400">No jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {jobs.slice(0, 10).map((job: any) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{job.campaign_name}</p>
                      <p className="text-xs text-gray-400">{job.job_number} · {job.city ?? "—"} · Due {formatDate(job.delivery_deadline)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("badge", JOB_STATUS_COLORS[job.status as keyof typeof JOB_STATUS_COLORS])}>{JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}</span>
                      <span className="text-xs text-gray-500 font-medium">{formatCurrency(job.client_price)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Contacts */}
          {contacts && contacts.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Contacts</h2>
              <div className="space-y-2">
                {contacts.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {c.name}
                        {c.is_primary && <span className="ml-2 badge bg-brand-50 text-brand-700 text-xs">Primary</span>}
                      </p>
                      {c.title && <p className="text-xs text-gray-400">{c.title}</p>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      {c.email && <a href={`mailto:${c.email}`} className="hover:text-brand-600">{c.email}</a>}
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact Info</h2>
            <dl className="space-y-3 text-sm">
              {client.contact_name && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 shrink-0 mt-0.5">Name</span>
                  <span className="font-medium text-gray-900">{client.contact_name}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <a href={`mailto:${client.email}`} className="text-brand-600 hover:text-brand-700 break-all">{client.email}</a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-700">{client.phone}</span>
                </div>
              )}
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Stats</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Jobs</dt>
                <dd className="font-semibold text-gray-900">{jobs?.length ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Active Jobs</dt>
                <dd className="font-semibold text-gray-900">{activeJobs.length}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <dt className="text-gray-500">Total Revenue</dt>
                <dd className="font-bold text-gray-900">{formatCurrency(totalRevenue)}</dd>
              </div>
            </dl>
          </div>

          {(client.preferred_workflow || client.special_instructions || client.notes) && (
            <div className="card p-5 space-y-3">
              {client.preferred_workflow && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Workflow</p>
                  <p className="text-sm text-gray-700">{client.preferred_workflow}</p>
                </div>
              )}
              {client.special_instructions && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Special Instructions</p>
                  <p className="text-sm text-gray-700">{client.special_instructions}</p>
                </div>
              )}
              {client.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{client.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
