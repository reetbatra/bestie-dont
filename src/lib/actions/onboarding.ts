"use server";

import { requireUserId } from "@/lib/supabase/server";
import { encryptField } from "@/lib/crypto";

/** Screen 02, The Date - sets the breakup date and starts the streak immediately. */
export async function startStreak(startDate: string) {
  const { supabase, userId } = await requireUserId();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ breakup_date: startDate })
    .eq("id", userId);
  if (profileError) return { error: profileError.message };

  const { error: streakError } = await supabase
    .from("streaks")
    .insert({ user_id: userId, start_date: startDate, is_active: true });
  if (streakError) return { error: streakError.message };

  return { success: true };
}

/**
 * Screen 03, First Record entry - is_raw is set by how close to the breakup
 * this was written (within 48h = raw, still-bleeding), not how close
 * occurred_on is to today. That's what the resist-screen rotation (Screen 08)
 * actually needs: whether this memory was captured before nostalgia had time
 * to edit it.
 */
export async function addFirstRecordEntry(fact: string, occurredOn: string) {
  const { supabase, userId } = await requireUserId();

  const { data: profile } = await supabase
    .from("profiles")
    .select("breakup_date")
    .eq("id", userId)
    .single();

  let isRaw = true;
  if (profile?.breakup_date) {
    const hoursSinceBreakup =
      (Date.now() - new Date(profile.breakup_date).getTime()) / (1000 * 60 * 60);
    isRaw = hoursSinceBreakup <= 48;
  }

  const { ciphertext, iv } = encryptField(fact);

  const { error } = await supabase.from("receipts").insert({
    user_id: userId,
    fact_encrypted: ciphertext,
    fact_iv: iv,
    occurred_on: occurredOn,
    is_raw: isRaw,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export interface IdentityItemInput {
  label: string;
  category: "hobby" | "friend" | "goal" | "trait";
}

/** Screen 04, What's Yours. */
export async function addIdentityItems(items: IdentityItemInput[]) {
  const { supabase, userId } = await requireUserId();
  if (items.length === 0) return { success: true };

  const { error } = await supabase
    .from("identity_items")
    .insert(items.map((item) => ({ user_id: userId, ...item })));
  if (error) return { error: error.message };
  return { success: true };
}

/** Screen 06 notification ask, folded into The Deal. */
export async function setNotificationPreference(optIn: boolean) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ notif_opt_in: optIn })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
}
