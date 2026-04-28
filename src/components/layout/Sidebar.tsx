"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCheck,
  Mail,
  DollarSign,
  Package,
  CheckSquare,
  LogOut,
  ChevronDown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Contractors",
    href: "/contractors",
    icon: UserCheck,
  },
  {
    label: "Email Intake",
    href: "/emails",
    icon: Mail,
  },
  {
    label: "Deliverables",
    href: "/deliverables",
    icon: Package,
  },
  {
    label: "Finance",
    href: "/finance",
    icon: DollarSign,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">1M</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">1mpression</p>
            <p className="text-xs text-gray-400 mt-0.5">Media Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link",
                isActive && "active"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* AI Badge */}
      <div className="px-3 pb-2">
        <div className="rounded-lg bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs font-semibold text-brand-700">AI Assistant</span>
          </div>
          <p className="text-xs text-gray-500">Phase 4 — coming soon</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleSignOut}
          className="btn-ghost w-full justify-start text-gray-500"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
