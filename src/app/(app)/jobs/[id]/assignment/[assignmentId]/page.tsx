import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import AssignmentActions from "@/components/jobs/AssignmentActions";
import OutreachCopyPanel from "@/components/jobs/OutreachCopyPanel";

interface PageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export const revalidate = 0;

export default async function AssignmentDetailPage({ params }: PageProps) {
  const { id, assignmentId } = await params;
  const supabase = await createClient();

  const [{ data: assignment }, { data: job }, { data: locations }] = await Promise.all([
    supabase
      .from("assignments")
      .select("*, contractor:contractors(*)")
      .eq("id", assignmentId)
      .eq("job_id", id)
      .single(),
    supabase
      .from("jobs")
      .select("*, client:clients(company)")
      .eq("id", id)
      .single(),
    supabase.from("job_locations").select("*").eq("job_id", id).order("sort_order"),
  ]);

  if (!assignment || !job) notFound();

  const STATUS_STEPS = ["draft", "pending_send", "sent", "accepted", "completed"];
  const currentStep = STATUS_STEPS.indexOf(assignment.status);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href={`/jobs/${id}`} className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Job
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Assignment</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {assignment.contractor?.name} — {job.campaign_name}
          </p>
        </div>
      </div>

      {/* Progress tracker */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className={cn(
                "flex flex-col items-center",
                i <= currentStep ? "text-brand-600" : "text-gray-300"
              )}>
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                  i < currentStep ? "bg-brand-600 border-brand-600 text-white" :
                  i === currentStep ? "border-brand-600 text-brand-600" :
                  "border-gray-200 text-gray-300"
                )}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span className="text-xs mt-1 capitalize whitespace-nowrap hidden sm:block">
                  {step.replace("_", " ")}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 mx-1",
                  i < currentStep ? "bg-brand-600" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          {/* Outreach copy */}
          <OutreachCopyPanel
            job={job}
            assignment={assignment}
            contractor={assignment.contractor}
            locations={locations ?? []}
          />
        </div>

        <div className="lg:col-span-2 space-y-5">
          {/* Contractor card */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Contractor</h2>
            <p className="font-medium text-gray-900">{assignment.contractor?.name}</p>
            {assignment.contractor?.email && (
              <a href={`mailto:${assignment.contractor.email}`} className="text-xs text-brand-600 block mt-0.5">
                {assignment.contractor.email}
              </a>
            )}
            {assignment.contractor?.phone && (
              <p className="text-xs text-gray-500 mt-0.5">{assignment.contractor.phone}</p>
            )}
            {assignment.contractor?.city && (
              <p className="text-xs text-gray-400 mt-0.5">{assignment.contractor.city}</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Agreed Rate</span>
                <span className="font-medium">{assignment.agreed_rate ? `${formatCurrency(assignment.agreed_rate)} / ${assignment.rate_unit ?? "flat"}` : "—"}</span>
              </div>
              {assignment.contractor_invoice_amount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Amount</span>
                  <span className="font-medium">{formatCurrency(assignment.contractor_invoice_amount)}</span>
                </div>
              )}
              {assignment.contractor_paid_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span className="font-medium text-green-600">{formatDate(assignment.contractor_paid_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <AssignmentActions
            assignmentId={assignmentId}
            jobId={id}
            currentStatus={assignment.status}
            contractorPaid={!!assignment.contractor_paid_at}
            invoiceAmount={assignment.contractor_invoice_amount}
          />

          {/* Notes */}
          {assignment.assignment_notes && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700">{assignment.assignment_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
