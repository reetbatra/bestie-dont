import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { streakDayNumber, streakSubtext, nextUncelebratedMilestone } from "@/lib/streak";
import { HomeShell } from "@/components/home/home-shell";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: streak } = await supabase
    .from("streaks")
    .select("id, start_date")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!streak) redirect("/onboarding/date");

  const day = streakDayNumber(streak.start_date);
  const journalDayIndex = Math.min(day, 56);

  const { data: prompt } = await supabase
    .from("journal_prompts")
    .select("prompt_text")
    .eq("day_index", journalDayIndex)
    .single();

  const { data: journalEntry } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("day_index", journalDayIndex)
    .maybeSingle();

  const { data: reached } = await supabase
    .from("milestones_reached")
    .select("day_number")
    .eq("user_id", user.id);

  const pendingMilestone = nextUncelebratedMilestone(
    day,
    (reached ?? []).map((r) => r.day_number),
  );

  return (
    <HomeShell
      day={day}
      subtext={streakSubtext(day)}
      promptText={prompt?.prompt_text ?? null}
      promptAnswered={Boolean(journalEntry)}
      pendingMilestone={pendingMilestone}
    />
  );
}
