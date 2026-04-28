import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { draftContractorMessage } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { assignmentId } = await request.json();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, contractor:contractors(name), job:jobs(*, client:clients(company))")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const { data: locations } = await supabase
    .from("job_locations")
    .select("*")
    .eq("job_id", assignment.job_id);

  const job = assignment.job as any;
  const result = await draftContractorMessage(
    assignment.contractor?.name ?? "Contractor",
    {
      campaignName: job?.campaign_name ?? "",
      client: job?.client?.company ?? "confidential",
      city: job?.city ?? job?.market ?? "TBD",
      shootDate: job?.shoot_date ?? "TBD",
      deliveryDeadline: job?.delivery_deadline ?? "TBD",
      requirements: job?.shoot_requirements ?? "Standard OOH photography",
      rate: assignment.agreed_rate
        ? `$${assignment.agreed_rate} per ${assignment.rate_unit ?? "job"}`
        : "TBD",
      locationCount: locations?.length ?? 0,
    }
  );

  return NextResponse.json(result);
}
