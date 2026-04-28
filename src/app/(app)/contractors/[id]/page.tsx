import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit, Mail, Phone, MapPin, Star } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-300 text-sm">Not rated</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("w-4 h-4", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
      ))}
    </div>
  );
}

export default async function ContractorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: contractor }, { data: assignments }] = await Promise.all([
    supabase.from("contractors").select("*").eq("id", id).single(),
    supabase
      .from("assignments")
      .select("*, job:jobs(id, job_number, campaign_name, status, shoot_date, city)")
      .eq("contractor_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!contractor) notFound();

  const totalEarned = (assignments ?? []).reduce(
    (sum: number, a: any) => sum + (a.contractor_invoice_amount ?? 0),
    0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link href="/contractors" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Contractors
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center text-xl font-bold text-brand-700">
            {contractor.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{contractor.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {contractor.city ?? "—"}{contractor.province ? `, ${contractor.province}` : ""}
            </p>
            <div className="mt-1">
              <StarRating rating={contractor.reliability_rating} />
            </div>
          </div>
        </div>
        <Link href={`/contractors/${id}/edit`} className="btn-secondary text-xs">
          <Edit className="w-3.5 h-3.5" /> Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Past Jobs */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Job History ({assignments?.length ?? 0})</h2>
            {!assignments || assignments.length === 0 ? (
              <p className="text-sm text-gray-400">No jobs assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {a.job ? (
                          <Link href={`/jobs/${a.job.id}`} className="hover:text-brand-600">
                            {a.job.campaign_name}
                          </Link>
                        ) : "Unknown Job"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.job?.job_number} · {a.job?.city ?? "—"} · {formatDate(a.job?.shoot_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "badge",
                        a.status === "completed" || a.status === "accepted" ? "bg-green-100 text-green-800" :
                        a.status === "declined" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {a.status}
                      </span>
                      {a.contractor_invoice_amount && (
                        <span className="text-xs font-medium text-gray-700">{formatCurrency(a.contractor_invoice_amount)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3 text-sm">
              {contractor.email && (
                <a href={`mailto:${contractor.email}`} className="flex items-center gap-2 text-brand-600 hover:text-brand-700">
                  <Mail className="w-4 h-4 shrink-0 text-gray-400" />
                  {contractor.email}
                </a>
              )}
              {contractor.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                  {contractor.phone}
                </div>
              )}
              {contractor.city && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                  {contractor.city}{contractor.province ? `, ${contractor.province}` : ""}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Services</h2>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {(contractor.services ?? []).map((s: string) => (
                <span key={s} className="badge bg-brand-50 text-brand-700 capitalize">{s.replace(/_/g, " ")}</span>
              ))}
            </div>
            <div className="flex gap-2 text-xs">
              {contractor.drone_capable && <span className="badge bg-blue-50 text-blue-700">Drone</span>}
              {contractor.has_vehicle && <span className="badge bg-green-50 text-green-700">Vehicle</span>}
            </div>

            {contractor.markets && contractor.markets.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">Markets covered</p>
                <div className="flex gap-1.5 flex-wrap">
                  {contractor.markets.map((m: string) => (
                    <span key={m} className="badge bg-gray-100 text-gray-600">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Rates</h2>
            <dl className="space-y-2 text-sm">
              {contractor.day_rate && <div className="flex justify-between"><dt className="text-gray-500">Day rate</dt><dd className="font-medium">{formatCurrency(contractor.day_rate)}</dd></div>}
              {contractor.half_day_rate && <div className="flex justify-between"><dt className="text-gray-500">Half day</dt><dd className="font-medium">{formatCurrency(contractor.half_day_rate)}</dd></div>}
              {contractor.hourly_rate && <div className="flex justify-between"><dt className="text-gray-500">Hourly</dt><dd className="font-medium">{formatCurrency(contractor.hourly_rate)}/hr</dd></div>}
              {contractor.per_location_rate && <div className="flex justify-between"><dt className="text-gray-500">Per location</dt><dd className="font-medium">{formatCurrency(contractor.per_location_rate)}</dd></div>}
            </dl>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Payment: <span className="text-gray-700 font-medium capitalize">{contractor.preferred_payment?.replace("_", " ")}</span></p>
              {contractor.payment_email && <p className="text-xs text-gray-500 mt-1">{contractor.payment_email}</p>}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Stats</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Jobs</dt>
                <dd className="font-semibold">{assignments?.length ?? 0}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <dt className="text-gray-500">Total Paid</dt>
                <dd className="font-bold text-gray-900">{formatCurrency(totalEarned)}</dd>
              </div>
            </dl>
          </div>

          {(contractor.portfolio_links ?? []).length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Portfolio</h2>
              <div className="space-y-1.5">
                {contractor.portfolio_links.map((link: string, i: number) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-brand-600 hover:text-brand-700 truncate">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}

          {contractor.notes && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700">{contractor.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
