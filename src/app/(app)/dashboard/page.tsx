import { createClient } from "@/lib/supabase/server";
import {
  Briefcase,
  AlertCircle,
  Clock,
  DollarSign,
  UserCheck,
  Package,
  TrendingUp,
  Calendar,
  Mail,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency, formatDate, JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";

export const revalidate = 0;

async function getDashboardData() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const [
    { count: newRequests },
    { count: needsAssignment },
    { count: inProgress },
    { count: overdue },
    { count: dueToday },
    { count: dueTomorrow },
    { count: dueWeek },
    { data: unpaidInvoices },
    { data: recentJobs },
    { data: urgentTasks },
  ] = await Promise.all([
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "new_request"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "needs_assignment"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).in("status", ["in_progress", "assigned", "captured"]),
    supabase.from("jobs").select("*", { count: "exact", head: true }).lt("delivery_deadline", today).not("status", "in", '("delivered","invoiced","paid","closed","cancelled")'),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("delivery_deadline", today).not("status", "in", '("delivered","invoiced","paid","closed","cancelled")'),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("delivery_deadline", tomorrow).not("status", "in", '("delivered","invoiced","paid","closed","cancelled")'),
    supabase.from("jobs").select("*", { count: "exact", head: true }).gte("delivery_deadline", today).lte("delivery_deadline", weekEnd).not("status", "in", '("delivered","invoiced","paid","closed","cancelled")'),
    supabase.from("invoices").select("id, total_amount, amount_paid, type, status, due_date").in("status", ["sent", "overdue", "partial"]).eq("type", "client"),
    supabase.from("jobs").select("*, client:clients(company)").order("created_at", { ascending: false }).limit(8),
    supabase.from("tasks").select("*, job:jobs(campaign_name, job_number)").in("status", ["pending", "in_progress"]).order("due_date", { ascending: true }).limit(5),
  ]);

  const unpaidTotal = (unpaidInvoices ?? []).reduce(
    (sum, inv) => sum + (inv.total_amount - (inv.amount_paid ?? 0)),
    0
  );

  return {
    newRequests: newRequests ?? 0,
    needsAssignment: needsAssignment ?? 0,
    inProgress: inProgress ?? 0,
    overdue: overdue ?? 0,
    dueToday: dueToday ?? 0,
    dueTomorrow: dueTomorrow ?? 0,
    dueWeek: dueWeek ?? 0,
    unpaidCount: unpaidInvoices?.length ?? 0,
    unpaidTotal,
    recentJobs: (recentJobs ?? []) as (Job & { client: { company: string } | null })[],
    urgentTasks: urgentTasks ?? [],
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="1mpression Media — Operations overview"
        actions={
          <Link href="/jobs/new" className="btn-primary">
            + New Job
          </Link>
        }
      />

      {/* Alert strip */}
      {(data.overdue > 0 || data.newRequests > 0) && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            {data.overdue > 0 && (
              <span className="font-semibold">{data.overdue} overdue job{data.overdue !== 1 ? "s" : ""}</span>
            )}
            {data.overdue > 0 && data.newRequests > 0 && " · "}
            {data.newRequests > 0 && (
              <span>{data.newRequests} new request{data.newRequests !== 1 ? "s" : ""} need review</span>
            )}
          </p>
          <Link href="/jobs?status=needs_review" className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2">
            Review
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link href="/jobs?status=new_request" className="block hover:opacity-90 transition-opacity">
          <StatCard
            label="New Requests"
            value={data.newRequests}
            icon={Mail}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        </Link>
        <Link href="/jobs?status=needs_assignment" className="block hover:opacity-90 transition-opacity">
          <StatCard
            label="Needs Assignment"
            value={data.needsAssignment}
            icon={UserCheck}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
        </Link>
        <Link href="/jobs?status=in_progress" className="block hover:opacity-90 transition-opacity">
          <StatCard
            label="In Progress"
            value={data.inProgress}
            icon={Briefcase}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
        </Link>
        <Link href="/jobs?overdue=true" className="block hover:opacity-90 transition-opacity">
          <StatCard
            label="Overdue"
            value={data.overdue}
            icon={AlertCircle}
            alert={data.overdue > 0}
          />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Due Today"
          value={data.dueToday}
          icon={Clock}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          alert={data.dueToday > 0}
        />
        <StatCard
          label="Due Tomorrow"
          value={data.dueTomorrow}
          icon={Calendar}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          label="Due This Week"
          value={data.dueWeek}
          icon={Calendar}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <Link href="/finance?filter=unpaid" className="block hover:opacity-90 transition-opacity">
          <StatCard
            label="Unpaid Invoices"
            value={data.unpaidCount}
            sub={formatCurrency(data.unpaidTotal) + " outstanding"}
            icon={DollarSign}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            alert={data.unpaidTotal > 0}
          />
        </Link>
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Jobs</h2>
            <Link href="/jobs" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentJobs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No jobs yet</p>
            ) : (
              data.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.campaign_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {job.client?.company ?? "No client"} · {job.city ?? job.market ?? "—"}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={cn("badge", JOB_STATUS_COLORS[job.status])}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                    {job.delivery_deadline && (
                      <span className="text-xs text-gray-400">{formatDate(job.delivery_deadline)}</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Upcoming Tasks</h2>
            <Link href="/tasks" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.urgentTasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">All clear — no pending tasks</p>
            ) : (
              data.urgentTasks.map((task: any) => (
                <div key={task.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    task.priority === "urgent" ? "bg-red-500" :
                    task.priority === "high" ? "bg-orange-400" :
                    task.priority === "medium" ? "bg-yellow-400" : "bg-gray-300"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.job && (
                      <p className="text-xs text-gray-400 truncate">
                        {task.job.job_number} · {task.job.campaign_name}
                      </p>
                    )}
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(task.due_date)}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick add task */}
          <div className="px-5 py-3 border-t border-gray-50">
            <Link href="/tasks/new" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              + Add task
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
