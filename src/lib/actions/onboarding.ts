"use server";

import { requireUserId } from "@/lib/supabase/server";
import { encryptField } from "@/lib/crypto";
import { profileAction } from "@/lib/perf/wrap";

/**
 * Screen 02, The Date - sets the breakup date and starts the streak immediately.
 *
 * Safe to run twice. Going back a screen and picking a different date used to
 * insert a second active streak every time; reads all take the newest one, so
 * nothing looked wrong, but every resubmit left a stray active row behind.
 * Now a resubmit moves the existing streak's start date instead.
 */
export async function startStreak(startDate: string) {
  return profileAction("startStreak", async () => {
    const { supabase, userId } = await requireUserId();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ breakup_date: startDate })
      .eq("id", userId);
    if (profileError) return { error: profileError.message };

    const { data: existing, error: lookupError } = await supabase
      .from("streaks")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) return { error: lookupError.message };

    const { error: streakError } = existing
      ? await supabase.from("streaks").update({ start_date: startDate }).eq("id", existing.id)
      : await supabase
          .from("streaks")
          .insert({ user_id: userId, start_date: startDate, is_active: true });
    if (streakError) return { error: streakError.message };

    return { success: true };
  });
}

/**
 * Screen 03, First Record entry - is_raw is set by how close to the breakup
 * this was written (within 48h = raw, still-bleeding), not how close
 * occurred_on is to today. That's what the resist-screen rotation (Screen 08)
 * actually needs: whether this memory was captured before nostalgia had time
 * to edit it.
 */
export async function addFirstRecordEntry(fact: string, occurredOn: string) {
  return profileAction("addFirstRecordEntry", async () => {
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
  });
}

export interface IdentityItemInput {
  label: string;
  category: "hobby" | "friend" | "goal" | "trait";
}

/** Screen 04, What's Yours. */
export async function addIdentityItems(items: IdentityItemInput[]) {
  return profileAction("addIdentityItems", async () => {
    const { supabase, userId } = await requireUserId();
    if (items.length === 0) return { success: true };

    // Coming back to this screen and saving again shouldn't double her list.
    const { data: existing, error: lookupError } = await supabase
      .from("identity_items")
      .select("label")
      .eq("user_id", userId);
    if (lookupError) return { error: lookupError.message };
    const saved = new Set((existing ?? []).map((row) => row.label.toLowerCase()));
    const fresh = items.filter((item) => !saved.has(item.label.toLowerCase()));
    if (fresh.length === 0) return { success: true };

    const { error } = await supabase
      .from("identity_items")
      .insert(fresh.map((item) => ({ user_id: userId, ...item })));
    if (error) return { error: error.message };
    return { success: true };
  });
}
