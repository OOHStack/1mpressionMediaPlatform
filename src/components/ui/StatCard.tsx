import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
  href?: string;
  alert?: boolean;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "text-brand-600",
  iconBg = "bg-brand-50",
  alert = false,
}: StatCardProps) {
  return (
    <div className={cn("card p-5", alert && "border-red-200 bg-red-50")}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn("text-sm font-medium", alert ? "text-red-600" : "text-gray-500")}>
            {label}
          </p>
          <p className={cn("text-2xl font-bold mt-1", alert ? "text-red-700" : "text-gray-900")}>
            {value}
          </p>
          {sub && (
            <p className={cn("text-xs mt-0.5", alert ? "text-red-500" : "text-gray-400")}>
              {sub}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", alert ? "bg-red-100" : iconBg)}>
          <Icon className={cn("w-5 h-5", alert ? "text-red-500" : iconColor)} />
        </div>
      </div>
    </div>
  );
}
