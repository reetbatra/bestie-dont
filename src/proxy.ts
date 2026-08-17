import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Vercel's edge network sets this from IP geolocation on every request in
 * production. Falls back to the server process's own zone in dev, where
 * that header doesn't exist - still better than hardcoding UTC.
 */
function resolveTimeZone(request: NextRequest): string {
  return request.headers.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export async function proxy(request: NextRequest) {
  const startedAt = performance.now();
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-user-timezone", resolveTimeZone(request));

  let response = NextResponse.next({ request: { headers: forwardedHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: forwardedHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touches the session so expiring tokens get refreshed before they hit a
  // Server Component. getSession(), not getUser(): both refresh a token that
  // is within 90s of expiry (EXPIRY_MARGIN_MS in auth-js), but getUser()
  // *always* makes a network round trip to Supabase Auth to re-verify, while
  // getSession() only goes to the network when there is actually something to
  // refresh. Profiling put that round trip at ~28ms on every single request in
  // production - static pages, RSC fetches behind tab switches, and pages that
  // need no session at all. Refreshes still happen, they just happen on the
  // ~1-in-many request where the token is genuinely near expiry.
  //
  // This is the same trade already made deliberately in lib/supabase/server.ts:
  // RLS is the security boundary (every table enforces user_id = auth.uid()),
  // so a forged cookie buys nothing, and re-verifying the JWT on every request
  // was paying a network call for a guarantee the database already gives.
  const authStartedAt = performance.now();
  await supabase.auth.getSession();
  const authMs = performance.now() - authStartedAt;

  // The middleware runs before - and outside - the request profile that
  // src/lib/perf covers, on every single request including static assets and
  // pages that need no session at all. Timing it here and shipping the
  // numbers as Server-Timing is the only way to see it: the profiler's
  // AsyncLocalStorage context does not reach across the middleware boundary.
  if (process.env.PROFILE === "1") {
    const totalMs = performance.now() - startedAt;
    response.headers.set(
      "Server-Timing",
      `proxy;dur=${totalMs.toFixed(1)};desc="middleware", ` +
        `proxyAuth;dur=${authMs.toFixed(1)};desc="auth.getSession"`,
    );
    console.log(
      `⏱ PROXY   ${request.nextUrl.pathname}  ${totalMs.toFixed(1)}ms ` +
        `(auth.getSession ${authMs.toFixed(1)}ms)`,
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|serwist|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
