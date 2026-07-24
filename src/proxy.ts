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

  // touches the session so expiring tokens get refreshed before they hit a Server Component
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|serwist|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
