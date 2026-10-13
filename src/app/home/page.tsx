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
import { profilePage } from "@/lib/perf/wrap";

export const metadata = { title: "Home" };

async function HomePage() {
  const { supabase, userId } = await requireSession();

  // Everything this screen needs, in one round trip.
  //
  // The prompt and the "has she answered today" check both key off the streak
  // day, which used to mean waiting for the streak row before they could even
  // start - two round trips for one screen. Neither actually needs a *query*
  // keyed by that day: journal_prompts is 56 fixed rows and her journal
  // entries are at most 56 day numbers, so both come back whole in the first
  // wave and the day arithmetic picks from them in memory.
  const [{ data: streak }, timeZone, { data: reached }, pendingRecovery, { data: prompts }, { data: answeredDays }] =
    await Promise.all([
      supabase
        .from("streaks")
        .select("id, start_date, is_extended")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      getUserTimeZone(),
      supabase.from("milestones_reached").select("day_number").eq("user_id", userId),
      getPendingRecovery(),
      supabase.from("journal_prompts").select("day_index, prompt_text"),
      supabase.from("journal_entries").select("day_index").eq("user_id", userId),
    ]);

  if (!streak) redirect("/onboarding/date");

  const day = streakDayNumber(streak.start_date, timeZone);
  const journalDayIndex = Math.min(day, 56);

  const prompt = (prompts ?? []).find((p) => p.day_index === journalDayIndex);
  const journalEntry = (answeredDays ?? []).some((e) => e.day_index === journalDayIndex);

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
      promptAnswered={journalEntry}
      pendingMilestone={pendingMilestone}
      pendingRecovery={pendingRecovery}
    />
  );
}

export default profilePage("/home", HomePage);
