import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import EmailEntryForm from "@/components/emails/EmailEntryForm";

export default function NewEmailPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/emails" className="btn-ghost text-gray-500 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Email Intake
        </Link>
      </div>
      <PageHeader title="Log Manual Request" description="Manually enter an incoming client request" />
      <EmailEntryForm />
    </div>
  );
}
