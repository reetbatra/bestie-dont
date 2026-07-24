import "server-only";
import { headers } from "next/headers";

const PRODUCTION_ORIGIN = "https://bestie.reetbatra.com";

/**
 * The Origin/Host request header is attacker-influenceable in principle -
 * relying on it to build redirect URLs means trusting that header validation
 * elsewhere (Next.js's Server Action CSRF check) always holds. Previously
 * this trusted any Origin ending in ".vercel.app", but that suffix isn't
 * scoped to this project - anyone can deploy their own project to a
 * "*.vercel.app" subdomain, so a spoofed Origin naming an attacker-owned
 * preview would have built a magic-link / checkout redirect pointing at it.
 * VERCEL_URL is platform-injected per deployment (not derived from the
 * request at all), so it identifies this project's own preview build
 * without trusting anything the client sent. Localhost is the one case that
 * still reads the request header, since local dev isn't reachable by a
 * remote attacker.
 */
export async function requestOrigin(): Promise<string> {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const headerList = await headers();
  const host = headerList.get("host");
  if (host?.startsWith("localhost")) return `http://${host}`;

  return PRODUCTION_ORIGIN;
}
