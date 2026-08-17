import "server-only";
import { headers } from "next/headers";
import { span } from "@/lib/perf/profiler";

const FALLBACK_TIME_ZONE = "UTC";

/**
 * IANA timezone for "today" boundaries. proxy.ts forwards Vercel's edge
 * geolocation header (`x-vercel-ip-timezone`) as `x-user-timezone` on every
 * request, so this is available on the very first server render - no
 * client-side round trip, no flash of the wrong day. Falls back to UTC when
 * the header is absent (local dev, non-Vercel hosting).
 */
export async function getUserTimeZone(): Promise<string> {
  return span("getUserTimeZone", "compute", async () => {
    const h = await headers();
    return h.get("x-user-timezone") ?? FALLBACK_TIME_ZONE;
  });
}
