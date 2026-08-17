"use server";

import { requireUserId } from "@/lib/supabase/server";
import { decryptField, decryptOptionalField, encryptField, encryptOptionalField } from "@/lib/crypto";
import { profileAction } from "@/lib/perf/wrap";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface DecryptedVaultEntry {
  id: string;
  content: string;
  createdAt: string;
  resurfacedAt: string | null;
  stillFeel: string | null;
  readyToResurface: boolean;
}

export async function listVaultEntries(): Promise<DecryptedVaultEntry[]> {
  return profileAction("listVaultEntries", async () => {
    const { supabase, userId } = await requireUserId();

    const { data: rows } = await supabase
      .from("vault_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return (rows ?? []).map((row) => {
      const age = Date.now() - new Date(row.created_at).getTime();
      return {
        id: row.id,
        content: decryptField(row.content_encrypted, row.content_iv),
        createdAt: row.created_at,
        resurfacedAt: row.resurfaced_at,
        stillFeel: decryptOptionalField(row.still_feel_encrypted, row.still_feel_iv),
        readyToResurface: age >= THIRTY_DAYS_MS && !row.resurfaced_at,
      };
    });
  });
}

export async function createVaultEntry(content: string) {
  return profileAction("createVaultEntry", async () => {
    const { supabase, userId } = await requireUserId();
    const { ciphertext, iv } = encryptField(content);

    const { error } = await supabase.from("vault_entries").insert({
      user_id: userId,
      content_encrypted: ciphertext,
      content_iv: iv,
    });
    if (error) return { error: error.message };
    return { success: true };
  });
}

export async function resurfaceEntry(id: string, stillFeel: string) {
  return profileAction("resurfaceEntry", async () => {
    const { supabase, userId } = await requireUserId();
    const { ciphertext, iv } = encryptOptionalField(stillFeel);

    const { error } = await supabase
      .from("vault_entries")
      .update({
        resurfaced_at: new Date().toISOString(),
        still_feel_encrypted: ciphertext,
        still_feel_iv: iv,
      })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    return { success: true };
  });
}
