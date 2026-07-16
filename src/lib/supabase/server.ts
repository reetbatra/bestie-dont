import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/types";

/** Server Component / Server Action client - reads and refreshes the session cookie. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // called from a Server Component with no request context to write to -
            // middleware.ts refreshes the session on the next request instead.
          }
        },
      },
    },
  );
}

/** Service-role client for trusted server-only paths (webhooks). Never import into client code. */
export function createServiceRoleClient() {
  return createSupabaseJsClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Shared by every Server Action that needs the current user. Uses
 * getSession() (reads the already-verified JWT from cookies) rather than
 * getUser() (a network round-trip to Supabase Auth every call) - proxy.ts
 * middleware already did the authoritative revalidation for this request,
 * so re-checking per action was pure redundant latency stacking up across
 * every data fetch on a page. RLS is the real security boundary regardless
 * (every table enforces user_id = auth.uid() at the database level), so
 * this doesn't trade away security, just redundant network calls.
 */
export async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No session.");
  return { supabase, userId: session.user.id, email: session.user.email ?? null };
}

/**
 * Same getSession()-not-getUser() reasoning as requireUserId, for the
 * page-level "redirect if not signed in" check every protected route
 * needs. Was previously duplicated 8x across app/ as its own getUser()
 * network call - same redundant-latency problem, different call site.
 */
export async function requireSession(redirectTo = "/onboarding") {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect(redirectTo);
  return { supabase, userId: session.user.id, email: session.user.email ?? null };
}

/** For the one spot (root page) that branches instead of hard-requiring a session. */
export async function getSessionUserId() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}
