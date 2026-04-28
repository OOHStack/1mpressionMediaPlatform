import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import TaskForm from "@/components/tasks/TaskForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewTaskPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_number, campaign_name")
    .not("status", "in", '("closed","cancelled","paid")')
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-4">
        <Link href="/tasks" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Tasks
        </Link>
      </div>
      <PageHeader title="New Task" description="Add a reminder or follow-up" />
      <TaskForm jobs={jobs ?? []} />
    </div>
  );
}
