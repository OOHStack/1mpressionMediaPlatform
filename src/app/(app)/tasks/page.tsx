import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import { CheckSquare, Plus } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import TaskStatusToggle from "@/components/tasks/TaskStatusToggle";

export const revalidate = 0;

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-gray-300",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

interface PageProps {
  searchParams: Promise<{ show?: string }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const showCompleted = params.show === "all";
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("*, job:jobs(id, job_number, campaign_name)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: true });

  if (!showCompleted) {
    query = query.not("status", "in", '("completed","cancelled")');
  }

  const { data: tasks } = await query;

  const pendingCount = (tasks ?? []).filter((t: any) => t.status === "pending" || t.status === "in_progress").length;
  const urgentCount = (tasks ?? []).filter((t: any) => t.priority === "urgent" && t.status !== "completed").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Tasks"
        description={`${pendingCount} pending${urgentCount > 0 ? ` · ${urgentCount} urgent` : ""}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={showCompleted ? "/tasks" : "/tasks?show=all"}
              className="btn-secondary text-xs"
            >
              {showCompleted ? "Hide Completed" : "Show All"}
            </Link>
            <Link href="/tasks/new" className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> New Task
            </Link>
          </div>
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
              <div key={task.id} className={cn(
                "flex items-start gap-4 px-5 py-4 transition-colors",
                task.status === "completed" ? "opacity-50 hover:opacity-75" : "hover:bg-gray-50"
              )}>
                {/* Complete toggle */}
                <TaskStatusToggle
                  taskId={task.id}
                  currentStatus={task.status}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn(
                      "text-sm font-medium",
                      task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"
                    )}>
                      {task.title}
                    </p>
                    <span className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      PRIORITY_COLORS[task.priority] ?? "bg-gray-300"
                    )}
                    title={PRIORITY_LABELS[task.priority]}
                    />
                  </div>

                  {task.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                  )}

                  {task.job && (
                    <Link href={`/jobs/${task.job.id}`} className="text-xs text-brand-600 hover:text-brand-700 mt-0.5 block">
                      {task.job.job_number} · {task.job.campaign_name}
                    </Link>
                  )}
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={cn("badge", STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-600")}>
                    {task.status.replace("_", " ")}
                  </span>
                  {task.due_date && (
                    <span className={cn(
                      "text-xs",
                      task.status !== "completed" && new Date(task.due_date) < new Date()
                        ? "text-red-500 font-medium"
                        : "text-gray-400"
                    )}>
                      {formatDate(task.due_date)}
                    </span>
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
