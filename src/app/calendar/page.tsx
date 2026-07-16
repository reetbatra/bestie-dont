import { redirect } from "next/navigation";
import { requireSession } from "@/lib/supabase/server";
import { streakDayNumber, daysRemaining, MILESTONE_DAYS, PROGRAM_LENGTH_DAYS } from "@/lib/streak";
import { CalendarGrid } from "@/components/calendar/calendar-grid";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * One honest sentence about when slips happen, or nothing. Weekday only -
 * backdated slips carry a synthetic noon timestamp, so time-of-day would
 * lie. Needs at least two slips sharing a weekday before it counts as a
 * pattern; n=1 is an anecdote.
 */
function slipInsight(occurredAts: string[]): string | null {
  if (occurredAts.length < 2) return null;

  const counts = new Map<number, number>();
  for (const at of occurredAts) {
    const weekday = new Date(at).getUTCDay();
    counts.set(weekday, (counts.get(weekday) ?? 0) + 1);
  }
  const [topDay, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCount < 2) return null;

  const total = occurredAts.length;
  const name = WEEKDAYS[topDay];
  if (topCount === total) {
    return total === 2 ? `Both slips were ${name}s.` : `All ${total} slips were ${name}s.`;
  }
  if (topCount / total > 0.5) {
    return `${topCount} of your ${total} slips were ${name}s.`;
  }
  return null;
}

export default async function CalendarPage() {
  const { supabase, userId } = await requireSession();

  const { data: streak } = await supabase
    .from("streaks")
    .select("id, start_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!streak) redirect("/onboarding/date");

  const day = streakDayNumber(streak.start_date);

  const { data: slips } = await supabase
    .from("slip_events")
    .select("occurred_at")
    .eq("streak_id", streak.id);

  const start = new Date(`${streak.start_date}T00:00:00`);
  const slipDays = new Set(
    (slips ?? []).map((s) => {
      const occurred = new Date(s.occurred_at);
      const occurredLocal = new Date(occurred.getFullYear(), occurred.getMonth(), occurred.getDate());
      const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      return Math.round((occurredLocal.getTime() - startLocal.getTime()) / 86_400_000) + 1;
    }),
  );

  return (
    <CalendarGrid
      currentDay={Math.min(day, PROGRAM_LENGTH_DAYS)}
      totalDays={PROGRAM_LENGTH_DAYS}
      daysLeft={daysRemaining(day)}
      startDate={streak.start_date}
      slipDays={[...slipDays]}
      slipInsight={slipInsight((slips ?? []).map((s) => s.occurred_at))}
      milestoneDays={MILESTONE_DAYS}
      graduated={day > PROGRAM_LENGTH_DAYS}
    />
  );
}
