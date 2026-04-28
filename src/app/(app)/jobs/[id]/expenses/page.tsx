import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ExpensesPanel from "@/components/finance/ExpensesPanel";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function JobExpensesPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: expenses }, { data: assignments }] = await Promise.all([
    supabase.from("jobs").select("id, job_number, campaign_name, client_price, contractor_budget").eq("id", id).single(),
    supabase.from("expenses").select("*").eq("job_id", id).order("created_at", { ascending: false }),
    supabase
      .from("assignments")
      .select("id, contractor_invoice_amount, agreed_rate, rate_unit, status, contractor:contractors(name)")
      .eq("job_id", id),
  ]);

  if (!job) notFound();

  const totalExpenses = (expenses ?? []).reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
  const contractorTotal = (assignments ?? []).reduce((s: number, a: any) => s + (a.contractor_invoice_amount ?? a.agreed_rate ?? 0), 0);
  const totalCost = totalExpenses + contractorTotal;
  const grossProfit = (job.client_price ?? 0) - totalCost;
  const margin = job.client_price ? (grossProfit / job.client_price) * 100 : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href={`/jobs/${id}`} className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Job
        </Link>
      </div>
      <PageHeader title="Job Finances" description={`${job.job_number} · ${job.campaign_name}`} />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Client Price", value: formatCurrency(job.client_price), color: "text-gray-900" },
          { label: "Total Costs", value: formatCurrency(totalCost), color: "text-gray-700" },
          { label: "Gross Profit", value: formatCurrency(grossProfit), color: grossProfit >= 0 ? "text-green-700" : "text-red-600" },
          { label: "Margin", value: margin != null ? `${margin.toFixed(0)}%` : "—", color: margin != null && margin < 30 ? "text-red-600 font-bold" : "text-green-700" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Contractor costs */}
      {assignments && assignments.length > 0 && (
        <div className="card p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Contractor Costs</h2>
          <div className="space-y-2">
            {assignments.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{a.contractor?.name ?? "Contractor"}</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(a.contractor_invoice_amount ?? a.agreed_rate)}
                  {!a.contractor_invoice_amount && a.agreed_rate && <span className="text-xs text-gray-400 ml-1">(budgeted)</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2">
            <span>Contractor Total</span>
            <span>{formatCurrency(contractorTotal)}</span>
          </div>
        </div>
      )}

      {/* Expenses */}
      <ExpensesPanel jobId={id} expenses={expenses ?? []} />
    </div>
  );
}
