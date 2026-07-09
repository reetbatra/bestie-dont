"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Screen 01, "I'm in" — starts an anonymous session with zero friction.
 * No email, no password. profiles row is created automatically by the
 * on_auth_user_created trigger (0001_init.sql).
 */
export async function startAnonymousSession() {
  const supabase = await createClient();

  const {
    data: { session: existing },
  } = await supabase.auth.getSession();
  if (existing) return { userId: existing.user.id };

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    return { error: error?.message ?? "Could not start a session." };
  }
  return { userId: data.user.id };
}

/**
 * Deferred signup — fires after her 2nd Record entry. Converts the
 * anonymous session into a permanent one via magic-link email, keeping the
 * same user id so every Record entry, streak day, and journal entry she's
 * already written stays attached to her account.
 */
export async function linkEmail(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
