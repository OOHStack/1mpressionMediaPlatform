import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ContractorForm from "@/components/contractors/ContractorForm";

export default function NewContractorPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/contractors" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Contractors
        </Link>
      </div>
      <PageHeader title="New Contractor" description="Add a photographer or videographer" />
      <ContractorForm />
    </div>
  );
}
