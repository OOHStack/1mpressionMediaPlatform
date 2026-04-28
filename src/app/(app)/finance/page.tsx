import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 0;

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-indigo-100 text-indigo-700",
  partial: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-400",
};

export default async function FinancePage() {
  const supabase = await createClient();

  const [{ data: invoices }, { data: jobs }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, client:clients(company), job:jobs(campaign_name, job_number)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("jobs")
      .select("id, client_price, contractor_budget, status")
      .not("status", "in", '("cancelled","closed")'),
  ]);

  const clientInvoices = (invoices ?? []).filter((i: any) => i.type === "client");
  const unpaid = clientInvoices.filter((i: any) => ["sent", "overdue", "partial"].includes(i.status));
  const paid = clientInvoices.filter((i: any) => i.status === "paid");
  const totalAR = unpaid.reduce((sum: number, i: any) => sum + (i.total_amount - (i.amount_paid ?? 0)), 0);
  const totalRevenue = paid.reduce((sum: number, i: any) => sum + (i.total_amount ?? 0), 0);

  const totalContractorBudget = (jobs ?? []).reduce((sum: number, j: any) => sum + (j.contractor_budget ?? 0), 0);
  const totalClientRevenue = (jobs ?? []).reduce((sum: number, j: any) => sum + (j.client_price ?? 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Finance" description="Revenue, invoices, and profitability" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total AR Outstanding" value={formatCurrency(totalAR)} icon={AlertCircle} iconBg="bg-red-50" iconColor="text-red-500" alert={totalAR > 0} />
        <StatCard label="Revenue (paid)" value={formatCurrency(totalRevenue)} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard label="Active Job Value" value={formatCurrency(totalClientRevenue)} icon={TrendingUp} iconBg="bg-brand-50" iconColor="text-brand-600" />
        <StatCard label="Contractor Payables" value={formatCurrency(totalContractorBudget)} icon={DollarSign} iconBg="bg-orange-50" iconColor="text-orange-600" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
          <Link href="/finance/invoices/new" className="btn-primary text-xs py-1.5">+ New Invoice</Link>
        </div>

        {!invoices || invoices.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">No invoices yet. Create one from a job.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-gray-700">{inv.invoice_number ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.client?.company ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {inv.job ? (
                        <Link href={`/jobs/${inv.job_id}`} className="hover:text-brand-600 truncate block max-w-xs">
                          {inv.job.job_number} · {inv.job.campaign_name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge capitalize", INVOICE_STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600")}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">
                      {formatDate(inv.due_date)}
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
