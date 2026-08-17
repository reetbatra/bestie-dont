"use server";

import { requireUserId } from "@/lib/supabase/server";
import { decryptOptionalField, encryptField } from "@/lib/crypto";
import { streakDayNumber, JOURNAL_FREE_DAYS, isInTrial } from "@/lib/streak";
import { getUserTimeZone } from "@/lib/server/user-timezone";
import { profileAction } from "@/lib/perf/wrap";

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

export interface JournalHistoryItem {
  dayIndex: number;
  promptText: string;
  response: string | null;
  skipped: boolean;
}

export interface JournalScreen {
  today: TodayJournal;
  history: JournalHistoryItem[];
}

/**
 * Everything the journal screen needs, in one round trip.
 *
 * This used to be two actions - today's prompt and the history - and each of
 * them was two round trips deep: read the streak, then read the prompt for
 * that day; read the entries, then read the prompts for those days. Six
 * queries, two of the four tables read twice, and the whole screen waiting on
 * the deepest chain.
 *
 * None of those queries actually depend on each other. The streak start date
 * is only needed to pick *which* prompt to show, and the prompt table is 56
 * fixed rows - small enough to fetch whole and index in memory, which is what
 * removes the dependency. So: four independent queries, fired together, and
 * the day arithmetic happens after they land.
 */
export async function getJournalScreen(): Promise<JournalScreen | null> {
  return profileAction("getJournalScreen", async () => {
    const { supabase, userId } = await requireUserId();

    const [{ data: streak }, { data: profile }, { data: prompts }, { data: entries }, timeZone] =
      await Promise.all([
        supabase
          .from("streaks")
          .select("start_date")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase.from("profiles").select("has_purchased").eq("id", userId).single(),
        supabase.from("journal_prompts").select("id, arc, day_index, prompt_text"),
        supabase
          .from("journal_entries")
          .select("day_index, response_encrypted, response_iv, skipped")
          .eq("user_id", userId)
          .order("day_index", { ascending: false }),
        getUserTimeZone(),
      ]);

    if (!streak) return null;

    const dayIndex = Math.min(streakDayNumber(streak.start_date, timeZone), 56);
    const promptByDay = new Map((prompts ?? []).map((p) => [p.day_index, p]));
    const prompt = promptByDay.get(dayIndex);
    if (!prompt) return null;

    const entry = (entries ?? []).find((e) => e.day_index === dayIndex);

    const hasPurchased = profile?.has_purchased ?? false;
    const hasFullAccess = hasPurchased || isInTrial(dayIndex);
    const locked = !hasFullAccess && dayIndex > JOURNAL_FREE_DAYS;

    return {
      today: {
        dayIndex,
        weekNumber: Math.ceil(dayIndex / 7),
        arcLabel: ARC_LABEL[prompt.arc] ?? prompt.arc,
        promptId: prompt.id,
        promptText: locked ? "" : prompt.prompt_text,
        existingResponse:
          !locked && entry
            ? decryptOptionalField(entry.response_encrypted, entry.response_iv)
            : null,
        skipped: entry?.skipped ?? false,
        locked,
        hasPurchased,
        inTrial: isInTrial(dayIndex) && !hasPurchased,
      },
      history: (entries ?? []).map((e) => ({
        dayIndex: e.day_index,
        promptText: promptByDay.get(e.day_index)?.prompt_text ?? "",
        response: e.skipped ? null : decryptOptionalField(e.response_encrypted, e.response_iv),
        skipped: e.skipped,
      })),
    };
  });
}

/**
 * getTodayJournal hides the prompt text and locks the UI for days past the
 * free teaser, but that's a client-side courtesy, not enforcement - without
 * this check, calling the action directly with any dayIndex writes a locked
 * day's entry for free. Mirrors the same locked formula getTodayJournal uses.
 */
async function assertJournalAccess(
  supabase: Awaited<ReturnType<typeof requireUserId>>["supabase"],
  userId: string,
  dayIndex: number,
) {
  return profileAction("assertJournalAccess", async () => {
    if (dayIndex <= JOURNAL_FREE_DAYS || isInTrial(dayIndex)) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("has_purchased")
      .eq("id", userId)
      .single();
    if (profile?.has_purchased) return null;

    return { error: "paywall" as const };
  });
}

export async function saveJournalEntry(dayIndex: number, promptId: string, response: string) {
  return profileAction("saveJournalEntry", async () => {
    const { supabase, userId } = await requireUserId();
    const accessError = await assertJournalAccess(supabase, userId, dayIndex);
    if (accessError) return accessError;

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
  });
}

export async function skipJournalEntry(dayIndex: number, promptId: string) {
  return profileAction("skipJournalEntry", async () => {
    const { supabase, userId } = await requireUserId();
    const accessError = await assertJournalAccess(supabase, userId, dayIndex);
    if (accessError) return accessError;

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
  });
}
