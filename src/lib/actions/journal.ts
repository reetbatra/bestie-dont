"use server";

import { requireUserId } from "@/lib/supabase/server";
import { decryptOptionalField, encryptField } from "@/lib/crypto";
import { streakDayNumber, JOURNAL_FREE_DAYS, isInTrial } from "@/lib/streak";

const ARC_LABEL: Record<string, string> = {
  stabilize: "Stabilize",
  pattern: "Pattern",
  rebuild: "Rebuild",
};

export interface TodayJournal {
  dayIndex: number;
  weekNumber: number;
  arcLabel: string;
  promptId: string | null;
  promptText: string;
  existingResponse: string | null;
  skipped: boolean;
  locked: boolean;
  hasPurchased: boolean;
  inTrial: boolean;
}

export async function getTodayJournal(): Promise<TodayJournal | null> {
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

  const dayIndex = Math.min(streakDayNumber(streak.start_date), 56);

  // prompt, profile, and this day's entry are all independent of each other
  // once dayIndex is known — fire them together instead of one round-trip
  // at a time (this was a big chunk of the "laggy" navigation feel).
  const [{ data: prompt }, { data: profile }, { data: entry }] = await Promise.all([
    supabase
      .from("journal_prompts")
      .select("id, arc, prompt_text")
      .eq("day_index", dayIndex)
      .single(),
    supabase.from("profiles").select("has_purchased").eq("id", userId).single(),
    supabase
      .from("journal_entries")
      .select("response_encrypted, response_iv, skipped")
      .eq("user_id", userId)
      .eq("day_index", dayIndex)
      .maybeSingle(),
  ]);

  if (!prompt) return null;

  const hasPurchased = profile?.has_purchased ?? false;
  const hasFullAccess = hasPurchased || isInTrial(dayIndex);
  const locked = !hasFullAccess && dayIndex > JOURNAL_FREE_DAYS;

  return {
    dayIndex,
    weekNumber: Math.ceil(dayIndex / 7),
    arcLabel: ARC_LABEL[prompt.arc] ?? prompt.arc,
    promptId: prompt.id,
    promptText: locked ? "" : prompt.prompt_text,
    existingResponse:
      !locked && entry ? decryptOptionalField(entry.response_encrypted, entry.response_iv) : null,
    skipped: entry?.skipped ?? false,
    locked,
    hasPurchased,
    inTrial: isInTrial(dayIndex) && !hasPurchased,
  };
}

export async function saveJournalEntry(dayIndex: number, promptId: string, response: string) {
  const { supabase, userId } = await requireUserId();
  const { ciphertext, iv } = encryptField(response);

  const { error } = await supabase.from("journal_entries").upsert(
    {
      user_id: userId,
      day_index: dayIndex,
      prompt_id: promptId,
      response_encrypted: ciphertext,
      response_iv: iv,
      skipped: false,
    },
    { onConflict: "user_id,day_index" },
  );
  if (error) return { error: error.message };
  return { success: true };
}

export async function skipJournalEntry(dayIndex: number, promptId: string) {
  const { supabase, userId } = await requireUserId();

  const { error } = await supabase.from("journal_entries").upsert(
    {
      user_id: userId,
      day_index: dayIndex,
      prompt_id: promptId,
      skipped: true,
    },
    { onConflict: "user_id,day_index" },
  );
  if (error) return { error: error.message };
  return { success: true };
}

export interface JournalHistoryItem {
  dayIndex: number;
  promptText: string;
  response: string | null;
  skipped: boolean;
}

export async function listJournalHistory(): Promise<JournalHistoryItem[]> {
  const { supabase, userId } = await requireUserId();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("day_index, response_encrypted, response_iv, skipped")
    .eq("user_id", userId)
    .order("day_index", { ascending: false });

  if (!entries || entries.length === 0) return [];

  const dayIndexes = entries.map((e) => e.day_index);
  const { data: prompts } = await supabase
    .from("journal_prompts")
    .select("day_index, prompt_text")
    .in("day_index", dayIndexes);

  const promptMap = new Map((prompts ?? []).map((p) => [p.day_index, p.prompt_text]));

  return entries.map((e) => ({
    dayIndex: e.day_index,
    promptText: promptMap.get(e.day_index) ?? "",
    response: e.skipped ? null : decryptOptionalField(e.response_encrypted, e.response_iv),
    skipped: e.skipped,
  }));
}
