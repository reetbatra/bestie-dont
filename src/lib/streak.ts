import { calendarDateEpoch, localDayEpoch } from "@/lib/timezone";

/**
 * `timeZone` defaults to UTC for callers that haven't been threaded through
 * yet, but every real call site should pass the caller's actual IANA zone
 * (see getUserTimeZone in timezone.ts) - the day boundary has to match her
 * local midnight, not the server process's own clock.
 */
export function streakDayNumber(startDate: string, timeZone: string = "UTC"): number {
  const startEpoch = calendarDateEpoch(startDate);
  const todayEpoch = localDayEpoch(new Date(), timeZone);
  const diffDays = Math.round((todayEpoch - startEpoch) / 86_400_000);
  return Math.max(1, diffDays + 1);
}

export const MILESTONE_DAYS = [3, 7, 14, 21, 30, 60] as const;

/**
 * How long after a logged slip the quiet recovery check-in fires - not a
 * MILESTONE_DAYS entry, since it's keyed off the slip date, not the streak
 * start, and there's nothing to celebrate. See /recovery/[slipId].
 */
export const RECOVERY_CHECKIN_DAYS = 3;

/** Free tier gets the first 3 days of the journal arc as a teaser, same numeric cap as the Record. */
export const JOURNAL_FREE_DAYS = 3;

/**
 * The program is 60 days, not a folk-wisdom "30 day rule" - research on
 * no-contact recovery finds roughly 30-90 days for real emotional
 * improvement, with contact in the first 28 days specifically slowing
 * recovery. 60 sits in the middle of that range and lines up with the
 * upper bound of habit-formation research (21-66 days). See /why.
 */
export const PROGRAM_LENGTH_DAYS = 60;

/**
 * The first week is free, full access, automatically - no card, no Dodo
 * subscription object. Deliberately NOT implemented as a billing "trial"
 * (which requires holding a card and auto-charging), since that's a
 * subscription pattern and this product is explicitly a one-time purchase.
 * It's just a calendar window: day <= 7 of her streak unlocks everything.
 */
export const TRIAL_DAYS = 7;

export function isInTrial(day: number): boolean {
  return day <= TRIAL_DAYS;
}

export function daysRemaining(day: number): number {
  return Math.max(0, PROGRAM_LENGTH_DAYS - day);
}

const MILESTONE_COPY: Record<number, string> = {
  3: "Three days. The urge is loudest right around now, and you're still here.",
  7: "A full week of your own life back.",
  14: "Two weeks. Long enough to notice the difference.",
  21: "Three weeks. This is starting to look like a pattern, and it's a good one.",
  30: "A month of decisions, all yours.",
  60: "Sixty days. Graduation.",
};

export function streakSubtext(day: number): string {
  if (MILESTONE_COPY[day]) return MILESTONE_COPY[day];
  return `Day ${day}. Another day that's yours.`;
}

/** Whole local days elapsed since `isoTimestamp`, using the same local-midnight boundary as streakDayNumber. */
export function daysSince(isoTimestamp: string, timeZone: string = "UTC"): number {
  const eventEpoch = localDayEpoch(new Date(isoTimestamp), timeZone);
  const todayEpoch = localDayEpoch(new Date(), timeZone);
  return Math.round((todayEpoch - eventEpoch) / 86_400_000);
}

export function nextUncelebratedMilestone(day: number, celebrated: number[]): number | null {
  for (const milestone of MILESTONE_DAYS) {
    if (day >= milestone && !celebrated.includes(milestone)) return milestone;
  }
  return null;
}
