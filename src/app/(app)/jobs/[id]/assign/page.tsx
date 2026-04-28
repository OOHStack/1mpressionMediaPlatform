import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import AssignContractorForm from "@/components/jobs/AssignContractorForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssignContractorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: contractors }] = await Promise.all([
    supabase.from("jobs").select("id, campaign_name, job_number, city, province, job_type").eq("id", id).single(),
    supabase
      .from("contractors")
      .select("id, name, email, phone, city, province, services, drone_capable, day_rate, reliability_rating")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!job) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href={`/jobs/${id}`} className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Job
        </Link>
      </div>
      <PageHeader
        title="Assign Contractor"
        description={`${job.job_number} · ${job.campaign_name}`}
      />
      <AssignContractorForm job={job} contractors={contractors ?? []} />
    </div>
  );
}
