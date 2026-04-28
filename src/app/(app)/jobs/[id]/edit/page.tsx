import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import JobForm from "@/components/jobs/JobForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: clients }, { data: locations }] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).single(),
    supabase.from("clients").select("id, company").eq("is_active", true).order("company"),
    supabase.from("job_locations").select("*").eq("job_id", id).order("sort_order"),
  ]);

  if (!job) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href={`/jobs/${id}`} className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Job
        </Link>
      </div>
      <PageHeader title="Edit Job" description={job.campaign_name} />
      <JobForm
        clients={clients ?? []}
        initialData={{
          ...job,
          locations: (locations ?? []).map((l: any) => ({
            name: l.name ?? "",
            address: l.address ?? "",
            board_id: l.board_id ?? "",
            notes: l.notes ?? "",
          })),
        }}
        jobId={id}
      />
    </div>
  );
}
