import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Daily ping that keeps the Supabase project awake.
 *
 * Free-tier Supabase projects auto-pause after a week without activity. When
 * that happened in October 2026 the project's hostname stopped resolving, so
 * "I'm in" failed for every new visitor and onboarding looked broken. One real
 * database read a day (scheduled in vercel.json) counts as activity.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on cron invocations, so
 * the route refuses anyone else rather than becoming a free public DB hit.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("CRON_SECRET is not set; refusing to run an unauthenticated keepalive.");
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("journal_prompts")
    .select("id", { count: "exact", head: true });

  if (error) {
    // Fail loudly: a red cron run in the Vercel dashboard is the early warning.
    console.error("[keepalive] Supabase read failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, prompts: count });
}
