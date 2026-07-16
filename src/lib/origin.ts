import "server-only";
import { headers } from "next/headers";

const PRODUCTION_ORIGIN = "https://bestie.reetbatra.com";

/**
 * The Origin/Host request header is attacker-influenceable in principle -
 * relying on it to build redirect URLs means trusting that header validation
 * elsewhere (Next.js's Server Action CSRF check) always holds. Instead of
 * depending on that implicitly, only trust the header for Vercel preview
 * URLs (which are dynamic and can't be hardcoded) and localhost dev;
 * anything else falls back to the known production origin.
 */
function resolveOrigin(headerOrigin: string | null): string {
  if (headerOrigin?.endsWith(".vercel.app")) return headerOrigin;
  if (headerOrigin?.startsWith("http://localhost")) return headerOrigin;
  return PRODUCTION_ORIGIN;
}

/** The origin redirect URLs should be built against for this request. */
export async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const headerOrigin =
    headerList.get("origin") ?? (headerList.get("host") ? `https://${headerList.get("host")}` : null);
  return resolveOrigin(headerOrigin);
}
