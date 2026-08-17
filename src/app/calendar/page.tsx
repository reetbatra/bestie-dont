import { redirect } from "next/navigation";
import { requireSession } from "@/lib/supabase/server";
import { streakDayNumber, daysRemaining, MILESTONE_DAYS, PROGRAM_LENGTH_DAYS } from "@/lib/streak";
import { calendarDateEpoch, localDayEpoch } from "@/lib/timezone";
import { getUserTimeZone } from "@/lib/server/user-timezone";
import { decryptOptionalField } from "@/lib/crypto";
import { CalendarGrid, type SlipDetail } from "@/components/calendar/calendar-grid";
import { profilePage } from "@/lib/perf/wrap";

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

async function CalendarPage() {
  const { supabase, userId } = await requireSession();

  // The slips query used to wait for the streak row so it could filter by
  // streak_id, which cost a second round trip for a filter. slip_events also
  // carries user_id, so the rows can be fetched in the same wave and narrowed
  // to this streak in memory once the streak arrives - same result, one trip.
  // A user has at most a handful of slips, so nothing is being over-fetched.
  const [{ data: streak }, timeZone, { data: allSlips }] = await Promise.all([
    supabase
      .from("streaks")
      .select("id, start_date")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    getUserTimeZone(),
    supabase
      .from("slip_events")
      .select("id, streak_id, occurred_at, note_encrypted, note_iv")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  if (!streak) redirect("/onboarding/date");

  const day = streakDayNumber(streak.start_date, timeZone);
  const slips = (allSlips ?? []).filter((s) => s.streak_id === streak.id);

  const startEpoch = calendarDateEpoch(streak.start_date);
  // Last write wins if a day somehow ends up with more than one slip (no
  // unique constraint enforces one-per-day) - rows are ascending by
  // created_at, so the most recent slip for a day is what surfaces.
  const slipDetails = new Map<number, SlipDetail>();
  for (const s of slips) {
    const occurredEpoch = localDayEpoch(new Date(s.occurred_at), timeZone);
    const dayNumber = Math.round((occurredEpoch - startEpoch) / 86_400_000) + 1;
    slipDetails.set(dayNumber, {
      id: s.id,
      note: decryptOptionalField(s.note_encrypted, s.note_iv),
    });
  }

  return (
    <CalendarGrid
      currentDay={Math.min(day, PROGRAM_LENGTH_DAYS)}
      totalDays={PROGRAM_LENGTH_DAYS}
      daysLeft={daysRemaining(day)}
      startDate={streak.start_date}
      slipDetails={[...slipDetails.entries()]}
      slipInsight={slipInsight(slips.map((s) => s.occurred_at))}
      milestoneDays={MILESTONE_DAYS}
      graduated={day > PROGRAM_LENGTH_DAYS}
    />
  );
}

export default profilePage("/calendar", CalendarPage);
