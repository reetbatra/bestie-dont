"use server";

import { requireUserId } from "@/lib/supabase/server";
import { decryptField, encryptOptionalField } from "@/lib/crypto";
import { streakDayNumber } from "@/lib/streak";

export interface ResistCard {
  recordFact: string | null;
  identityLabel: string | null;
}

/**
 * Screen 08, the urge timer. Pulls one Record entry and one identity
 * reminder at random so the same pair never gets stared at twice in a row
 * (habituation kills impact, per the strategy doc).
 */
export async function getResistCard(): Promise<ResistCard> {
  const { supabase, userId } = await requireUserId();

  const [{ data: entries }, { data: identities }] = await Promise.all([
    supabase
      .from("receipts")
      .select("fact_encrypted, fact_iv")
      .eq("user_id", userId)
      .limit(50),
    supabase.from("identity_items").select("label").eq("user_id", userId).limit(50),
  ]);

  let recordFact: string | null = null;
  if (entries && entries.length > 0) {
    const pick = entries[Math.floor(Math.random() * entries.length)];
    recordFact = decryptField(pick.fact_encrypted, pick.fact_iv);
  }

  let identityLabel: string | null = null;
  if (identities && identities.length > 0) {
    identityLabel = identities[Math.floor(Math.random() * identities.length)].label;
  }

  return { recordFact, identityLabel };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The repair mechanic: a slip is logged as an annotated timeline event, and
 * the streak keeps counting. No reset, no shame-quit trigger.
 *
 * `occurredOn` (yyyy-mm-dd) backdates the slip to an earlier streak day -
 * the common case is "I texted him last night and I'm logging it this
 * morning". Omitted = now, which is what the panic flow sends. Backdated
 * slips are stored at noon UTC so the calendar's day mapping lands on the
 * chosen date regardless of the server's timezone.
 */
export async function logSlip(note: string, occurredOn?: string) {
  const { supabase, userId } = await requireUserId();

  const { data: streak } = await supabase
    .from("streaks")
    .select("id, start_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!streak) return { error: "No active streak found." };

  if (occurredOn !== undefined) {
    if (!ISO_DATE.test(occurredOn)) return { error: "Invalid date." };
    const start = new Date(`${streak.start_date}T00:00:00Z`);
    const chosen = new Date(`${occurredOn}T00:00:00Z`);
    const slipDay = Math.round((chosen.getTime() - start.getTime()) / 86_400_000) + 1;
    if (slipDay < 1 || slipDay > streakDayNumber(streak.start_date)) {
      return { error: "That day isn't part of this streak yet." };
    }
  }

  const { ciphertext, iv } = encryptOptionalField(note);

  const { error } = await supabase.from("slip_events").insert({
    streak_id: streak.id,
    user_id: userId,
    note_encrypted: ciphertext,
    note_iv: iv,
    ...(occurredOn !== undefined && { occurred_at: `${occurredOn}T12:00:00.000Z` }),
  });
  if (error) return { error: error.message };
  return { success: true };
}
