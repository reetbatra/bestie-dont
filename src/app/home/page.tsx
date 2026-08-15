import { redirect } from "next/navigation";
import { requireSession } from "@/lib/supabase/server";
import {
  streakDayNumber,
  streakSubtext,
  nextUncelebratedMilestone,
  daysRemaining,
  programLengthDays,
} from "@/lib/streak";
import { getUserTimeZone } from "@/lib/server/user-timezone";
import { getPendingRecovery } from "@/lib/actions/recovery";
import { HomeShell } from "@/components/home/home-shell";

export default async function HomePage() {
  const { supabase, userId } = await requireSession();

  const [{ data: streak }, timeZone] = await Promise.all([
    supabase
      .from("streaks")
      .select("id, start_date, is_extended")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    getUserTimeZone(),
  ]);

  if (!streak) redirect("/onboarding/date");

  const day = streakDayNumber(streak.start_date, timeZone);
  const journalDayIndex = Math.min(day, 56);

  // These four are independent of each other once the streak day is known
  // - run them together instead of one network round-trip at a time.
  const [{ data: prompt }, { data: journalEntry }, { data: reached }, pendingRecovery] = await Promise.all([
    supabase.from("journal_prompts").select("prompt_text").eq("day_index", journalDayIndex).single(),
    supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", userId)
      .eq("day_index", journalDayIndex)
      .maybeSingle(),
    supabase.from("milestones_reached").select("day_number").eq("user_id", userId),
    getPendingRecovery(),
  ]);

  const pendingMilestone = nextUncelebratedMilestone(
    day,
    (reached ?? []).map((r) => r.day_number),
    streak.is_extended,
  );

  return (
    <HomeShell
      day={day}
      daysLeft={daysRemaining(day, streak.is_extended)}
      programLengthDays={programLengthDays(streak.is_extended)}
      isExtended={streak.is_extended}
      subtext={streakSubtext(day)}
      promptText={prompt?.prompt_text ?? null}
      promptAnswered={Boolean(journalEntry)}
      pendingMilestone={pendingMilestone}
      pendingRecovery={pendingRecovery}
    />
  );
}
