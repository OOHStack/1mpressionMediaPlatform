import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ClientForm from "@/components/clients/ClientForm";

export default function NewClientPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/clients" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Clients
        </Link>
      </div>
      <PageHeader title="New Client" description="Add a client or agency" />
      <ClientForm />
    </div>
  );
}
