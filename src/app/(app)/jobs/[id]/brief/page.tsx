import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobBriefPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: locations }, { data: assignments }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, client:clients(company, email, phone)")
      .eq("id", id)
      .single(),
    supabase.from("job_locations").select("*").eq("job_id", id).order("sort_order"),
    supabase
      .from("assignments")
      .select("*, contractor:contractors(name, email, phone)")
      .eq("job_id", id)
      .eq("status", "accepted")
      .limit(1),
  ]);

  if (!job) notFound();

  const assignment = assignments?.[0];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between no-print">
        <Link href={`/jobs/${id}`} className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Job
        </Link>
        <button onClick={() => window.print()} className="btn-secondary text-xs">
          <Printer className="w-4 h-4" /> Print / Export PDF
        </button>
      </div>

      <div className="card p-8 print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Photographer Brief</h1>
            <p className="text-lg text-gray-600 mt-1">{job.campaign_name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">1mpression Media</p>
            <p className="text-xs text-gray-500">{job.job_number}</p>
          </div>
        </div>

        {/* Campaign Details */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Campaign Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="text-gray-500">Client:</span> <span className="font-medium">{job.client?.company ?? "—"}</span></div>
            <div><span className="text-gray-500">Market:</span> <span className="font-medium">{job.city ?? job.market ?? "—"}{job.province ? `, ${job.province}` : ""}</span></div>
            <div><span className="text-gray-500">Shoot Date:</span> <span className="font-bold">{formatDate(job.shoot_date)}{job.shoot_time ? ` at ${job.shoot_time}` : ""}</span></div>
            <div><span className="text-gray-500">Delivery Deadline:</span> <span className="font-bold text-red-600">{formatDate(job.delivery_deadline)}</span></div>
          </div>
        </section>

        {/* Assigned contractor */}
        {assignment?.contractor && (
          <section className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Assigned To</h2>
            <p className="font-semibold text-gray-900">{assignment.contractor.name}</p>
            {assignment.contractor.email && <p className="text-sm text-gray-600">{assignment.contractor.email}</p>}
          </section>
        )}

        {/* Requirements */}
        {job.shoot_requirements && (
          <section className="mb-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Shoot Requirements</h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{job.shoot_requirements}</p>
          </section>
        )}

        {/* Standard Shot Requirements */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Standard Shot Requirements</h2>
          <div className="space-y-1.5 text-sm">
            {[
              "Close-up of creative/advertising copy",
              "Distance / context shot showing board in environment",
              "Traffic shot with vehicles moving toward board",
              "Creative clearly visible and in focus",
              "No obstructions blocking creative where possible",
              "Tripod used for all static shots",
            ].map((req) => (
              <div key={req} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-gray-400 shrink-0 flex items-center justify-center text-xs">☐</div>
                <span>{req}</span>
              </div>
            ))}
            {job.job_type.includes("drone") && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-gray-400 shrink-0 flex items-center justify-center text-xs">☐</div>
                <span>Drone aerial shot at appropriate altitude and angle</span>
              </div>
            )}
          </div>
        </section>

        {/* Locations */}
        {locations && locations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Locations ({locations.length})
            </h2>
            <div className="space-y-4">
              {locations.map((loc: any, i: number) => (
                <div key={loc.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{i + 1}. {loc.name ?? `Location ${i + 1}`}</p>
                      {loc.address && <p className="text-sm text-gray-600">{loc.address}</p>}
                      {loc.board_id && <p className="text-xs text-gray-400">Board ID: {loc.board_id}</p>}
                      {loc.notes && <p className="text-xs text-gray-500 italic mt-1">{loc.notes}</p>}
                    </div>
                    {loc.address && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(loc.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 font-medium ml-3 shrink-0"
                      >
                        Google Maps ↗
                      </a>
                    )}
                  </div>
                  {/* Per-location checklist */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {["Close-up", "Distance/context", "Traffic moving toward board", "Creative visible", "No obstruction", "Uploaded", "Notes"].map((item) => (
                      <div key={item} className="flex items-center gap-1.5">
                        <span className="text-gray-400">☐</span>
                        <span className="text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deliverables */}
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Deliverables</h2>
          <p className="text-sm text-gray-800">
            {job.deliverables_required ?? "High-resolution JPEGs for all locations. RAW files if applicable. Submit via the provided upload link."}
          </p>
        </section>

        {/* Submission instructions */}
        <section className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">Submission Instructions</h2>
          <ol className="text-sm text-gray-800 space-y-1 list-decimal list-inside">
            <li>Upload all photos/videos to the shared Google Drive or Dropbox folder provided.</li>
            <li>Use the naming convention: <strong>CampaignName_Location_YYYYMMDD_001.jpg</strong></li>
            <li>Send your invoice to <strong>billing@1mpressionmedia.ca</strong></li>
            <li>Submit files by: <strong className="text-red-600">{formatDate(job.delivery_deadline)}</strong></li>
          </ol>
        </section>

        {/* Contact */}
        <section className="pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">Questions?</p>
          <p className="text-sm text-gray-700">Contact 1mpression Media Operations — <a href="mailto:ops@1mpressionmedia.ca" className="text-brand-600">ops@1mpressionmedia.ca</a></p>
        </section>
      </div>
    </div>
  );
}
