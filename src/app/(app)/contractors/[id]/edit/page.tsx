import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ContractorForm from "@/components/contractors/ContractorForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContractorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: contractor } = await supabase.from("contractors").select("*").eq("id", id).single();
  if (!contractor) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href={`/contractors/${id}`} className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Contractor
        </Link>
      </div>
      <PageHeader title="Edit Contractor" description={contractor.name} />
      <ContractorForm initialData={contractor} contractorId={id} />
    </div>
  );
}
