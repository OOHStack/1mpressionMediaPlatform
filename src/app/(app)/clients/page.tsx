import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import ClientSearch from "@/components/clients/ClientSearch";

export const revalidate = 0;

const TYPE_COLORS: Record<string, string> = {
  agency: "bg-blue-100 text-blue-700",
  vendor: "bg-purple-100 text-purple-700",
  brand: "bg-green-100 text-green-700",
  partner: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-600",
};

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select(`
      id, company, contact_name, email, type, is_active,
      jobs:jobs(count)
    `)
    .eq("is_active", true)
    .order("company");

  if (params.q) query = query.ilike("company", `%${params.q}%`);
  if (params.type) query = query.eq("type", params.type);

  const { data: clients } = await query;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clients"
        description={`${clients?.length ?? 0} active clients`}
        actions={
          <Link href="/clients/new" className="btn-primary">
            <Plus className="w-4 h-4" /> New Client
          </Link>
        }
      />

      <ClientSearch currentQ={params.q} currentType={params.type} />

      <div className="card overflow-hidden mt-4">
        {!clients || clients.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No clients found"
            description="Add your first client to get started."
            action={
              <Link href="/clients/new" className="btn-primary">
                <Plus className="w-4 h-4" /> New Client
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Jobs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((client: any) => (
                  <tr key={client.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium text-gray-900 hover:text-brand-600"
                      >
                        {client.company}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {client.contact_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {client.email ? (
                        <a href={`mailto:${client.email}`} className="hover:text-brand-600">
                          {client.email}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge capitalize", TYPE_COLORS[client.type] ?? "bg-gray-100 text-gray-600")}>
                        {client.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">
                      {(client.jobs as any[])?.[0]?.count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
