export function streakDayNumber(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((todayLocal.getTime() - startLocal.getTime()) / 86_400_000);
  return Math.max(1, diffDays + 1);
}

export const MILESTONE_DAYS = [3, 7, 14, 21, 30, 60] as const;

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

export function nextUncelebratedMilestone(day: number, celebrated: number[]): number | null {
  for (const milestone of MILESTONE_DAYS) {
    if (day >= milestone && !celebrated.includes(milestone)) return milestone;
  }
  return null;
}
