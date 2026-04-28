import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { CheckSquare, Plus } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 0;

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-gray-300",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, job:jobs(id, job_number, campaign_name)")
    .not("status", "in", '("completed","cancelled")')
    .order("due_date", { ascending: true, nullsFirst: false });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Tasks"
        description="Reminders and follow-ups"
        actions={
          <Link href="/tasks/new" className="btn-primary">
            <Plus className="w-4 h-4" /> New Task
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {!tasks || tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No pending tasks"
            description="You're all caught up."
            action={<Link href="/tasks/new" className="btn-primary"><Plus className="w-4 h-4" /> Add Task</Link>}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {tasks.map((task: any) => (
              <div key={task.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", PRIORITY_COLORS[task.priority] ?? "bg-gray-300")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                  {task.job && (
                    <Link href={`/jobs/${task.job.id}`} className="text-xs text-brand-600 hover:text-brand-700 mt-0.5 block">
                      {task.job.job_number} · {task.job.campaign_name}
                    </Link>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={cn("badge", STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-600")}>
                    {task.status.replace("_", " ")}
                  </span>
                  {task.due_date && (
                    <span className="text-xs text-gray-400">{formatDate(task.due_date)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
