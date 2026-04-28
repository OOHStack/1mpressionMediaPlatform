import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, UserCheck, Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import ContractorSearch from "@/components/contractors/ContractorSearch";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ q?: string; city?: string; service?: string; drone?: string }>;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-300">—</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={cn("text-sm", s <= rating ? "text-yellow-400" : "text-gray-200")}>★</span>
      ))}
    </div>
  );
}

export default async function ContractorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("contractors")
    .select("id, name, email, phone, city, province, services, drone_capable, has_vehicle, reliability_rating, day_rate, is_active")
    .eq("is_active", true)
    .order("name");

  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.drone === "true") query = query.eq("drone_capable", true);

  const { data: contractors } = await query;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Contractors"
        description={`${contractors?.length ?? 0} active contractors`}
        actions={
          <Link href="/contractors/new" className="btn-primary">
            <Plus className="w-4 h-4" /> New Contractor
          </Link>
        }
      />

      <ContractorSearch currentQ={params.q} currentCity={params.city} currentDrone={params.drone} />

      <div className="card overflow-hidden mt-4">
        {!contractors || contractors.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No contractors found"
            description="Add your first photographer or videographer."
            action={
              <Link href="/contractors/new" className="btn-primary">
                <Plus className="w-4 h-4" /> Add Contractor
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">City</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Services</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Caps</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 hidden xl:table-cell">Day Rate</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contractors.map((c: any) => (
                  <tr key={c.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <Link href={`/contractors/${c.id}`} className="font-medium text-gray-900 hover:text-brand-600 block">
                        {c.name}
                      </Link>
                      {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {c.city ?? "—"}{c.province ? `, ${c.province}` : ""}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {(c.services ?? []).slice(0, 3).map((s: string) => (
                          <span key={s} className="badge bg-gray-100 text-gray-600 capitalize">{s.replace(/_/g, " ")}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex gap-1">
                        {c.drone_capable && <span className="badge bg-blue-50 text-blue-700">Drone</span>}
                        {c.has_vehicle && <span className="badge bg-green-50 text-green-700">Vehicle</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 hidden xl:table-cell">
                      {c.day_rate ? `$${c.day_rate}/day` : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <StarRating rating={c.reliability_rating} />
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
