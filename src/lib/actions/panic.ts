"use server";

import { createClient } from "@/lib/supabase/server";
import { decryptField, encryptOptionalField } from "@/lib/crypto";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No session.");
  return { supabase, userId: user.id };
}

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

/**
 * The repair mechanic: a slip is logged as an annotated timeline event, and
 * the streak keeps counting. No reset, no shame-quit trigger.
 */
export async function logSlip(note: string) {
  const { supabase, userId } = await requireUserId();

  const { data: streak } = await supabase
    .from("streaks")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!streak) return { error: "No active streak found." };

  const { ciphertext, iv } = encryptOptionalField(note);

  const { error } = await supabase.from("slip_events").insert({
    streak_id: streak.id,
    user_id: userId,
    note_encrypted: ciphertext,
    note_iv: iv,
  });
  if (error) return { error: error.message };
  return { success: true };
}
