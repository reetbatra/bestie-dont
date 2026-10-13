"use server";

import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/origin";
import { profileAction } from "@/lib/perf/wrap";

/**
 * Screen 01, "I'm in" - starts an anonymous session with zero friction.
 * No email, no password. profiles row is created automatically by the
 * on_auth_user_created trigger (0001_init.sql).
 */
export async function startAnonymousSession() {
  return profileAction("startAnonymousSession", async () => {
    const supabase = await createClient();

    const {
      data: { session: existing },
    } = await supabase.auth.getSession();
    if (existing) return { userId: existing.user.id };

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      // The client only ever shows her friendly copy, so this log line is the
      // one place the real cause survives. It's how the October 2026 outage
      // (Supabase project auto-paused, every request failing DNS) would have
      // been obvious from the Vercel logs instead of a vague "try again".
      console.error("[startAnonymousSession] signInAnonymously failed", {
        name: error?.name,
        status: error?.status,
        code: error?.code,
        message: error?.message,
      });
      return {
        error: error?.message ?? "Could not start a session.",
        unreachable: error?.name === "AuthRetryableFetchError" || error?.status === 0,
      };
    }
    return { userId: data.user.id };
  });
}

/**
 * Deferred signup - fires after her 2nd Record entry. Converts the
 * anonymous session into a permanent one via magic-link email, keeping the
 * same user id so every Record entry, streak day, and journal entry she's
 * already written stays attached to her account.
 */
export async function linkEmail(email: string) {
  return profileAction("linkEmail", async () => {
    const supabase = await createClient();

    // Without an explicit emailRedirectTo, the confirmation link falls back
    // to the Supabase project's Site URL - which shipped as the default
    // localhost:3000 and stranded her on "Safari can't open the page" after
    // clicking the email. Land her on Settings, where the saved email state
    // is visible. The URL must also be in the project's redirect allowlist.
    const origin = await requestOrigin();
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${origin}/settings` },
    );
    if (error) return { error: error.message };
    return { success: true };
  });
}

export async function signOut() {
  return profileAction("signOut", async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
  });
}
