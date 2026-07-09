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

const MILESTONE_COPY: Record<number, string> = {
  1: "The hardest one. You showed up.",
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
