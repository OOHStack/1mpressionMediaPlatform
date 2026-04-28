"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskStatusToggleProps {
  taskId: string;
  currentStatus: string;
}

export default function TaskStatusToggle({ taskId, currentStatus }: TaskStatusToggleProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const isCompleted = currentStatus === "completed";

  async function toggle() {
    setLoading(true);
    const newStatus = isCompleted ? "pending" : "completed";
    await supabase
      .from("tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", taskId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors",
        isCompleted
          ? "bg-green-500 border-green-500"
          : "border-gray-300 hover:border-brand-500"
      )}
    >
      {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </button>
  );
}
