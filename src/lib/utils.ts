import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import type { JobStatus, JobType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "MMM d, yyyy");
  } catch {
    return date;
  }
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "MMM d");
  } catch {
    return date;
  }
}

export function dueDateLabel(date: string | null | undefined): string {
  if (!date) return "No date";
  try {
    const d = parseISO(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isPast(d)) return "Overdue";
    return format(d, "MMM d");
  } catch {
    return date;
  }
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  try {
    return isPast(parseISO(date)) && !isToday(parseISO(date));
  } catch {
    return false;
  }
}

export function profitMargin(
  clientPrice: number | null,
  contractorBudget: number | null
): number | null {
  if (!clientPrice || clientPrice === 0) return null;
  const cost = contractorBudget ?? 0;
  return ((clientPrice - cost) / clientPrice) * 100;
}

export function formatMargin(margin: number | null): string {
  if (margin == null) return "—";
  return `${margin.toFixed(0)}%`;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new_request: "New Request",
  needs_review: "Needs Review",
  quoted: "Quoted",
  approved: "Approved",
  needs_assignment: "Needs Assignment",
  assigned: "Assigned",
  in_progress: "In Progress",
  captured: "Captured",
  delivered: "Delivered",
  invoiced: "Invoiced",
  paid: "Paid",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  new_request: "bg-blue-100 text-blue-800",
  needs_review: "bg-yellow-100 text-yellow-800",
  quoted: "bg-purple-100 text-purple-800",
  approved: "bg-indigo-100 text-indigo-800",
  needs_assignment: "bg-orange-100 text-orange-800",
  assigned: "bg-cyan-100 text-cyan-800",
  in_progress: "bg-blue-100 text-blue-700",
  captured: "bg-teal-100 text-teal-800",
  delivered: "bg-green-100 text-green-800",
  invoiced: "bg-violet-100 text-violet-800",
  paid: "bg-green-100 text-green-900",
  closed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  photography: "Photography",
  videography: "Videography",
  drone_photography: "Drone Photography",
  drone_video: "Drone Video",
  monitoring: "Monitoring",
  posting_confirmation: "Posting Confirmation",
  custom: "Custom",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
