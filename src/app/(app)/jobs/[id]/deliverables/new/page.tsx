import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DeliverableForm from "@/components/deliverables/DeliverableForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewDeliverablePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("id, campaign_name, job_number").eq("id", id).single();
  if (!job) notFound();

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-4">
        <Link href={`/jobs/${id}`} className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Job
        </Link>
      </div>
      <PageHeader title="Add Deliverable" description={`${job.job_number} · ${job.campaign_name}`} />
      <DeliverableForm jobId={id} />
    </div>
  );
}
