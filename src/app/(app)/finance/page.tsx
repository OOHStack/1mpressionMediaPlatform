import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import InvoiceActionsCell from "@/components/finance/InvoiceActionsCell";
import RevenueChart from "@/components/finance/RevenueChart";

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

interface PageProps {
  searchParams: Promise<{ filter?: string; tab?: string }>;
}

export default async function FinancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const activeTab = params.tab ?? "invoices";

  const [{ data: invoices }, { data: jobs }, { data: assignments }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, client:clients(company), job:jobs(id, campaign_name, job_number)")
      .order("created_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("id, job_number, campaign_name, client_price, contractor_budget, status, city, client:clients(company)")
      .not("status", "in", '("cancelled")'),
    supabase
      .from("assignments")
      .select("job_id, contractor_invoice_amount, contractor_paid_at, contractor:contractors(name)")
      .not("status", "in", '("declined","cancelled")'),
  ]);

  const clientInvoices = (invoices ?? []).filter((i: any) => i.type === "client");
  const unpaid = clientInvoices.filter((i: any) => ["sent", "overdue", "partial", "draft"].includes(i.status));
  const paid = clientInvoices.filter((i: any) => i.status === "paid");
  const overdue = clientInvoices.filter((i: any) => i.status === "overdue");
  const totalAR = unpaid.filter((i: any) => i.status !== "draft").reduce((sum: number, i: any) => sum + (i.total_amount - (i.amount_paid ?? 0)), 0);
  const totalRevenue = paid.reduce((sum: number, i: any) => sum + (i.total_amount ?? 0), 0);

  // Contractor payables (unpaid)
  const unpaidContractors = (assignments ?? []).filter((a: any) => !a.contractor_paid_at && a.contractor_invoice_amount);
  const totalPayables = unpaidContractors.reduce((sum: number, a: any) => sum + (a.contractor_invoice_amount ?? 0), 0);

  // Job profitability
  const jobsWithMargin = (jobs ?? []).map((j: any) => {
    const contractorCost = (assignments ?? [])
      .filter((a: any) => a.job_id === j.id)
      .reduce((s: number, a: any) => s + (a.contractor_invoice_amount ?? 0), 0);
    const price = j.client_price ?? 0;
    const cost = contractorCost || (j.contractor_budget ?? 0);
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : null;
    return { ...j, contractorCost, profit, margin };
  });

  // Monthly revenue for chart
  const monthlyData = buildMonthlyData(paid);

  // Filter current tab's invoices
  const filteredInvoices = activeTab === "unpaid"
    ? clientInvoices.filter((i: any) => ["sent", "overdue", "partial"].includes(i.status))
    : activeTab === "paid"
      ? paid
      : clientInvoices;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Finance"
        description="Revenue, invoices, and profitability"
        actions={
          <Link href="/finance/invoices/new" className="btn-primary text-xs">+ New Invoice</Link>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="AR Outstanding" value={formatCurrency(totalAR)} icon={AlertCircle} iconBg="bg-red-50" iconColor="text-red-500" alert={totalAR > 0} />
        <StatCard label="Overdue" value={overdue.length} icon={Clock} iconBg="bg-orange-50" iconColor="text-orange-500" alert={overdue.length > 0} />
        <StatCard label="Revenue Collected" value={formatCurrency(totalRevenue)} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard label="Contractor Payables" value={formatCurrency(totalPayables)} icon={DollarSign} iconBg="bg-orange-50" iconColor="text-orange-600" />
        <StatCard label="Active Job Pipeline" value={formatCurrency((jobs ?? []).reduce((s: number, j: any) => s + (j.client_price ?? 0), 0))} icon={TrendingUp} iconBg="bg-brand-50" iconColor="text-brand-600" />
      </div>

      {/* Revenue chart */}
      {monthlyData.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue (Last 6 Months)</h2>
          <RevenueChart data={monthlyData} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {[
          { key: "invoices", label: "All Invoices" },
          { key: "unpaid", label: "Unpaid / Overdue" },
          { key: "paid", label: "Paid" },
          { key: "payables", label: "Contractor Payables" },
          { key: "profitability", label: "Job Profitability" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/finance?tab=${t.key}`}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === t.key
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Invoices table */}
      {activeTab !== "payables" && activeTab !== "profitability" && (
        <div className="card overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No invoices in this view.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Job</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Paid</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Due</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-gray-700">{inv.invoice_number ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[140px]">{inv.client?.company ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {inv.job ? (
                          <Link href={`/jobs/${inv.job_id}`} className="hover:text-brand-600 truncate block max-w-[180px]">
                            {inv.job.job_number} · {inv.job.campaign_name}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("badge capitalize", INVOICE_STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600")}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-4 py-3 text-right text-green-600 hidden lg:table-cell">
                        {inv.amount_paid > 0 ? formatCurrency(inv.amount_paid) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3 text-right">
                        <InvoiceActionsCell invoiceId={inv.id} currentStatus={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatCurrency(filteredInvoices.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contractor payables */}
      {activeTab === "payables" && (
        <div className="card overflow-hidden">
          {unpaidContractors.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No outstanding contractor payables.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Contractor</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Amount Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unpaidContractors.map((a: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.contractor?.name ?? "Unknown"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-700">{formatCurrency(a.contractor_invoice_amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold">Total Payable</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-700">{formatCurrency(totalPayables)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Profitability table */}
      {activeTab === "profitability" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">City</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Revenue</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Profit</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobsWithMargin.sort((a: any, b: any) => (b.margin ?? 0) - (a.margin ?? 0)).map((j: any) => (
                  <tr key={j.id} className={cn("hover:bg-gray-50", j.margin !== null && j.margin < 30 ? "bg-red-50/40" : "")}>
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${j.id}`} className="font-medium text-gray-900 hover:text-brand-600 block truncate max-w-[200px]">
                        {j.campaign_name}
                      </Link>
                      <span className="text-xs text-gray-400">{j.job_number}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{j.client?.company ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{j.city ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(j.client_price)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(j.contractorCost || j.contractor_budget)}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold", j.profit >= 0 ? "text-green-700" : "text-red-600")}>
                      {formatCurrency(j.profit)}
                    </td>
                    <td className={cn("px-4 py-3 text-right font-bold", j.margin !== null && j.margin < 30 ? "text-red-600" : "text-green-700")}>
                      {j.margin != null ? `${j.margin.toFixed(0)}%` : "—"}
                      {j.margin !== null && j.margin < 30 && <span className="text-xs ml-1">⚠</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function buildMonthlyData(paidInvoices: any[]): { month: string; revenue: number }[] {
  const map: Record<string, number> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    map[key] = 0;
  }

  paidInvoices.forEach((inv) => {
    const d = new Date(inv.paid_date ?? inv.updated_at);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (key in map) map[key] = (map[key] ?? 0) + (inv.total_amount ?? 0);
  });

  return Object.entries(map).map(([month, revenue]) => ({ month, revenue }));
}
