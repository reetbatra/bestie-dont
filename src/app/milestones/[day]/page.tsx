import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMilestoneData } from "@/lib/actions/milestones";
import { MilestoneView } from "@/components/milestones/milestone-view";

export default async function MilestonePage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: dayParam } = await params;
  const day = Number(dayParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const data = await getMilestoneData(day);
  if (!data) notFound();

  return <MilestoneView data={data} />;
}
