import { notFound } from "next/navigation";
import { requireSession } from "@/lib/supabase/server";
import { getMilestoneData } from "@/lib/actions/milestones";
import { MilestoneView } from "@/components/milestones/milestone-view";

export default async function MilestonePage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: dayParam } = await params;
  const day = Number(dayParam);

  await requireSession();

  const data = await getMilestoneData(day);
  if (!data) notFound();

  return <MilestoneView data={data} />;
}
