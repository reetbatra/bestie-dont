"use server";

import { createClient } from "@/lib/supabase/server";
import { streakDayNumber, MILESTONE_DAYS, nextUncelebratedMilestone } from "@/lib/streak";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No session.");
  return { supabase, userId: user.id };
}

export async function getNextMilestone(): Promise<number | null> {
  const { supabase, userId } = await requireUserId();

  const { data: streak } = await supabase
    .from("streaks")
    .select("start_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!streak) return null;

  const day = streakDayNumber(streak.start_date);

  const { data: reached } = await supabase
    .from("milestones_reached")
    .select("day_number")
    .eq("user_id", userId);

  return nextUncelebratedMilestone(day, (reached ?? []).map((r) => r.day_number));
}

export interface MilestoneData {
  day: number;
  nightsSurvived: number;
  memoriesLogged: number;
  journalEntriesWritten: number;
}

export async function getMilestoneData(day: number): Promise<MilestoneData | null> {
  const { supabase, userId } = await requireUserId();

  if (!MILESTONE_DAYS.includes(day as (typeof MILESTONE_DAYS)[number])) return null;

  const { data: streak } = await supabase
    .from("streaks")
    .select("start_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!streak) return null;

  const currentDay = streakDayNumber(streak.start_date);
  if (currentDay < day) return null;

  const [{ count: receiptCount }, { count: journalCount }] = await Promise.all([
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

  return {
    day,
    nightsSurvived: currentDay,
    memoriesLogged: receiptCount ?? 0,
    journalEntriesWritten: journalCount ?? 0,
  };
}
