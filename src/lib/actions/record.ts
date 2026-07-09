"use server";

import { createClient } from "@/lib/supabase/server";
import { decryptField, decryptOptionalField, encryptField, encryptOptionalField } from "@/lib/crypto";

const FREE_TIER_LIMIT = 3;

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No session.");
  return { supabase, userId: user.id };
}

export interface RecordEntry {
  id: string;
  fact: string;
  feeling: string | null;
  selfFacing: string | null;
  occurredOn: string;
  isRaw: boolean;
  createdAt: string;
}

export async function listRecordEntries(): Promise<{
  entries: RecordEntry[];
  atFreeLimit: boolean;
  hasPurchased: boolean;
}> {
  const { supabase, userId } = await requireUserId();

  // The underlying table is still named `receipts` — renaming it means
  // another manual migration step, and nothing user-facing reads the table
  // name. The app-layer naming ("Record") is what she actually sees.
  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase
      .from("receipts")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false }),
    supabase.from("profiles").select("has_purchased").eq("id", userId).single(),
  ]);

  const entries: RecordEntry[] = (rows ?? []).map((row) => ({
    id: row.id,
    fact: decryptField(row.fact_encrypted, row.fact_iv),
    feeling: decryptOptionalField(row.feeling_encrypted, row.feeling_iv),
    selfFacing: decryptOptionalField(row.self_facing_encrypted, row.self_facing_iv),
    occurredOn: row.occurred_on,
    isRaw: row.is_raw,
    createdAt: row.created_at,
  }));

  const hasPurchased = profile?.has_purchased ?? false;

  return {
    entries,
    atFreeLimit: !hasPurchased && entries.length >= FREE_TIER_LIMIT,
    hasPurchased,
  };
}

export async function createRecordEntry(input: {
  fact: string;
  feeling?: string;
  selfFacing?: string;
  occurredOn: string;
}) {
  const { supabase, userId } = await requireUserId();

  const { count } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_purchased, breakup_date")
    .eq("id", userId)
    .single();

  if (!profile?.has_purchased && (count ?? 0) >= FREE_TIER_LIMIT) {
    return { error: "paywall" as const };
  }

  let isRaw = true;
  if (profile?.breakup_date) {
    const hoursSinceBreakup =
      (Date.now() - new Date(profile.breakup_date).getTime()) / (1000 * 60 * 60);
    isRaw = hoursSinceBreakup <= 48;
  }

  const fact = encryptField(input.fact);
  const feeling = encryptOptionalField(input.feeling);
  const selfFacing = encryptOptionalField(input.selfFacing);

  const { error } = await supabase.from("receipts").insert({
    user_id: userId,
    fact_encrypted: fact.ciphertext,
    fact_iv: fact.iv,
    feeling_encrypted: feeling.ciphertext,
    feeling_iv: feeling.iv,
    self_facing_encrypted: selfFacing.ciphertext,
    self_facing_iv: selfFacing.iv,
    occurred_on: input.occurredOn,
    is_raw: isRaw,
  });
  if (error) return { error: error.message };
  return { success: true as const };
}

export async function deleteRecordEntry(id: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("receipts").delete().eq("id", id).eq("user_id", userId);
  if (error) return { error: error.message };
  return { success: true };
}
