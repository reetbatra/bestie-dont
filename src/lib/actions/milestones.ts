"use server";

import { requireUserId } from "@/lib/supabase/server";
import {
  streakDayNumber,
  milestoneDaysFor,
  nextUncelebratedMilestone,
  PROGRAM_LENGTH_DAYS,
  EXTENDED_PROGRAM_LENGTH_DAYS,
} from "@/lib/streak";
import { getUserTimeZone } from "@/lib/server/user-timezone";
import { profileAction } from "@/lib/perf/wrap";

export async function getNextMilestone(): Promise<number | null> {
  return profileAction("getNextMilestone", async () => {
    const { supabase, userId } = await requireUserId();

    const [{ data: streak }, timeZone] = await Promise.all([
      supabase
        .from("streaks")
        .select("start_date, is_extended")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      getUserTimeZone(),
    ]);
    if (!streak) return null;

    const day = streakDayNumber(streak.start_date, timeZone);

    const { data: reached } = await supabase
      .from("milestones_reached")
      .select("day_number")
      .eq("user_id", userId);

    return nextUncelebratedMilestone(
      day,
      (reached ?? []).map((r) => r.day_number),
      streak.is_extended,
    );
  });
}

export interface MilestoneData {
  day: number;
  nightsSurvived: number;
  memoriesLogged: number;
  journalEntriesWritten: number;
  /** True once the program's final milestone for this streak has been reached - 60 normally, 90 if extended. */
  isFinalMilestone: boolean;
  /** Day 60 only, and only before she's opted in: offers the 30-day detox extension. */
  showExtensionOffer: boolean;
}

export async function getMilestoneData(day: number): Promise<MilestoneData | null> {
  return profileAction("getMilestoneData", async () => {
    const { supabase, userId } = await requireUserId();

    const [{ data: streak }, timeZone] = await Promise.all([
      supabase
        .from("streaks")
        .select("start_date, is_extended")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      getUserTimeZone(),
    ]);
    if (!streak) return null;

    if (!milestoneDaysFor(streak.is_extended).includes(day)) return null;

    const currentDay = streakDayNumber(streak.start_date, timeZone);
    if (currentDay < day) return null;

    const [{ count: recordEntryCount }, { count: journalCount }] = await Promise.all([
      supabase.from("receipts").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("skipped", false),
      supabase
        .from("milestones_reached")
        .upsert({ user_id: userId, day_number: day }, { onConflict: "user_id,day_number", ignoreDuplicates: true }),
    ]);

    const finalDay = streak.is_extended ? EXTENDED_PROGRAM_LENGTH_DAYS : PROGRAM_LENGTH_DAYS;

    return {
      day,
      nightsSurvived: currentDay,
      memoriesLogged: recordEntryCount ?? 0,
      journalEntriesWritten: journalCount ?? 0,
      isFinalMilestone: day === finalDay,
      showExtensionOffer: day === PROGRAM_LENGTH_DAYS && !streak.is_extended,
    };
  });
}

/**
 * Opts an active streak into the 30-day detox extension. Only valid from
 * the day-60 milestone onward and only once - there's no un-extending, same
 * as there's no un-graduating.
 */
export async function extendProgram(): Promise<{ error: string } | { success: true }> {
  return profileAction("extendProgram", async () => {
    const { supabase, userId } = await requireUserId();

    const [{ data: streak }, timeZone] = await Promise.all([
      supabase
        .from("streaks")
        .select("id, start_date, is_extended")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      getUserTimeZone(),
    ]);
    if (!streak) return { error: "No active streak found." };
    if (streak.is_extended) return { error: "Already extended." };

    const day = streakDayNumber(streak.start_date, timeZone);
    if (day < PROGRAM_LENGTH_DAYS) return { error: "Extension unlocks at day 60." };

    const { error } = await supabase.from("streaks").update({ is_extended: true }).eq("id", streak.id);
    if (error) return { error: error.message };
    return { success: true };
  });
}
