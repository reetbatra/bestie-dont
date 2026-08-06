"use server";

import { requireUserId } from "@/lib/supabase/server";
import { RECOVERY_CHECKIN_DAYS, daysSince } from "@/lib/streak";
import { getUserTimeZone } from "@/lib/server/user-timezone";

export interface PendingRecovery {
  slipId: string;
  daysSince: number;
}

export async function getPendingRecovery(): Promise<PendingRecovery | null> {
  const { supabase, userId } = await requireUserId();

  const [{ data: slip }, timeZone] = await Promise.all([
    supabase
      .from("slip_events")
      .select("id, occurred_at")
      .eq("user_id", userId)
      .is("recovery_seen_at", null)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .single(),
    getUserTimeZone(),
  ]);
  if (!slip) return null;

  const elapsed = daysSince(slip.occurred_at, timeZone);
  if (elapsed < RECOVERY_CHECKIN_DAYS) return null;

  return { slipId: slip.id, daysSince: elapsed };
}

export interface RecoveryData {
  daysSince: number;
}

/**
 * Marks this slip - and any older still-unseen ones - as seen so a run of
 * missed slips doesn't queue up a backlog of cards. Same upsert-on-read
 * shape as getMilestoneData in milestones.ts.
 */
export async function getRecoveryData(slipId: string): Promise<RecoveryData | null> {
  const { supabase, userId } = await requireUserId();

  const [{ data: slip }, timeZone] = await Promise.all([
    supabase
      .from("slip_events")
      .select("id, occurred_at")
      .eq("id", slipId)
      .eq("user_id", userId)
      .single(),
    getUserTimeZone(),
  ]);
  if (!slip) return null;

  const elapsed = daysSince(slip.occurred_at, timeZone);

  await supabase
    .from("slip_events")
    .update({ recovery_seen_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("recovery_seen_at", null)
    .lte("occurred_at", slip.occurred_at);

  return { daysSince: elapsed };
}
