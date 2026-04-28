import { cn, JOB_STATUS_COLORS, JOB_STATUS_LABELS } from "@/lib/utils";
import type { JobStatus } from "@/types";

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        JOB_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {JOB_STATUS_LABELS[status] ?? status}
    </span>
  );
}
