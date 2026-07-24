/**
 * Pure timezone math only - no `next/headers` import here. streak.ts pulls
 * these into client-bundled components (milestone-view.tsx), so this file
 * has to stay safe to bundle for the browser. Server-only timezone lookup
 * lives in `@/lib/server/user-timezone`.
 */

/** Midnight (as a UTC epoch ms) of `date`'s calendar day in `timeZone`. Two dates in the same local day always produce the same value, regardless of what timezone the server process itself runs in. */
export function localDayEpoch(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day));
}

/** Same as localDayEpoch, but for a plain `YYYY-MM-DD` calendar date (e.g. a Postgres `date` column) with no time-of-day or timezone of its own. */
export function calendarDateEpoch(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
