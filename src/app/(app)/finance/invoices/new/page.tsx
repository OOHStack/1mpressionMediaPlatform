import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CreateStandaloneInvoiceForm from "@/components/finance/CreateStandaloneInvoiceForm";

export default async function NewStandaloneInvoicePage() {
  const supabase = await createClient();
  const [{ data: clients }, { data: jobs }] = await Promise.all([
    supabase.from("clients").select("id, company").eq("is_active", true).order("company"),
    supabase.from("jobs").select("id, job_number, campaign_name").not("status", "in", '("closed","cancelled")').order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-4">
        <Link href="/finance" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Finance
        </Link>
      </div>
      <PageHeader title="New Invoice" description="Create a client invoice" />
      <CreateStandaloneInvoiceForm clients={clients ?? []} jobs={jobs ?? []} />
    </div>
  );
}
