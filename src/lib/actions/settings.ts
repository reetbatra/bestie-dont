"use server";

import { createClient, createServiceRoleClient, requireUserId } from "@/lib/supabase/server";
import {
  decryptField,
  decryptOptionalField,
  encryptOptionalField,
} from "@/lib/crypto";

export interface SettingsData {
  hisName: string | null;
  hasPurchased: boolean;
  email: string | null;
}

export async function getSettings(): Promise<SettingsData> {
  const { supabase, userId, email } = await requireUserId();

  const { data: profile } = await supabase
    .from("profiles")
    .select("his_name_encrypted, his_name_iv, has_purchased")
    .eq("id", userId)
    .single();

  return {
    hisName: decryptOptionalField(profile?.his_name_encrypted ?? null, profile?.his_name_iv ?? null),
    hasPurchased: profile?.has_purchased ?? false,
    email,
  };
}

export async function updateHisName(name: string) {
  const { supabase, userId } = await requireUserId();
  const { ciphertext, iv } = encryptOptionalField(name.trim() || null);

  const { error } = await supabase
    .from("profiles")
    .update({ his_name_encrypted: ciphertext, his_name_iv: iv })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Everything she's written, decrypted, as one JSON file. "Explicit
 * no-training-no-selling promise in plain language" cuts both ways: her data
 * is hers to take with her too.
 */
export async function exportUserData() {
  const { supabase, userId } = await requireUserId();

  const [profile, streaks, recordEntries, vaultEntries, journalEntries, identityItems, milestones] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("streaks").select("*").eq("user_id", userId),
      supabase.from("receipts").select("*").eq("user_id", userId),
      supabase.from("vault_entries").select("*").eq("user_id", userId),
      supabase.from("journal_entries").select("*").eq("user_id", userId),
      supabase.from("identity_items").select("*").eq("user_id", userId),
      supabase.from("milestones_reached").select("*").eq("user_id", userId),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: profile.data
      ? {
          breakupDate: profile.data.breakup_date,
          hisName: decryptOptionalField(profile.data.his_name_encrypted, profile.data.his_name_iv),
        }
      : null,
    streaks: streaks.data ?? [],
    record: (recordEntries.data ?? []).map((r) => ({
      occurredOn: r.occurred_on,
      isRaw: r.is_raw,
      fact: decryptField(r.fact_encrypted, r.fact_iv),
      feeling: decryptOptionalField(r.feeling_encrypted, r.feeling_iv),
      selfFacing: decryptOptionalField(r.self_facing_encrypted, r.self_facing_iv),
      createdAt: r.created_at,
    })),
    vaultEntries: (vaultEntries.data ?? []).map((v) => ({
      content: decryptField(v.content_encrypted, v.content_iv),
      createdAt: v.created_at,
      resurfacedAt: v.resurfaced_at,
      stillFeel: decryptOptionalField(v.still_feel_encrypted, v.still_feel_iv),
    })),
    journalEntries: (journalEntries.data ?? []).map((j) => ({
      dayIndex: j.day_index,
      skipped: j.skipped,
      response: j.skipped ? null : decryptOptionalField(j.response_encrypted, j.response_iv),
      createdAt: j.created_at,
    })),
    identityItems: (identityItems.data ?? []).map((i) => ({
      label: i.label,
      category: i.category,
    })),
    milestonesReached: (milestones.data ?? []).map((m) => m.day_number),
  };
}

/**
 * Deletes the auth user via the service role. Every table cascades on
 * auth.users(id) delete (0001_init.sql), so this is the whole account, gone
 * in one call, no orphaned rows anywhere.
 */
export async function deleteAccount() {
  const { userId } = await requireUserId();
  const admin = createServiceRoleClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  const supabase = await createClient();
  await supabase.auth.signOut();

  return { success: true };
}
