import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import JobForm from "@/components/jobs/JobForm";

export default async function NewJobPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, company")
    .eq("is_active", true)
    .order("company");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/jobs" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Jobs
        </Link>
      </div>
      <PageHeader title="New Job" description="Create a new campaign job" />
      <JobForm clients={clients ?? []} />
    </div>
  );
}
