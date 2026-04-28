import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ClientForm from "@/components/clients/ClientForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href={`/clients/${id}`} className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Client
        </Link>
      </div>
      <PageHeader title="Edit Client" description={client.company} />
      <ClientForm initialData={client} clientId={id} />
    </div>
  );
}
