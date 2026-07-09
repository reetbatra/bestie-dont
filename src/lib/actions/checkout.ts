"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDodoClient, DODO_PRODUCT_ID } from "@/lib/dodo";

const PRODUCTION_ORIGIN = "https://bestie.reetbatra.com";

/**
 * The Origin/Host request header is attacker-influenceable in principle —
 * relying on it to build the post-payment redirect URL means trusting that
 * header validation elsewhere (Next.js's Server Action CSRF check) always
 * holds. Instead of depending on that implicitly, only trust the header for
 * Vercel preview URLs (which are dynamic and can't be hardcoded); anything
 * else falls back to the known production origin.
 */
function resolveOrigin(headerOrigin: string | null): string {
  if (headerOrigin?.endsWith(".vercel.app")) return headerOrigin;
  if (headerOrigin?.startsWith("http://localhost")) return headerOrigin;
  return PRODUCTION_ORIGIN;
}

export async function startCheckout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No session." };

  const headerList = await headers();
  const headerOrigin = headerList.get("origin") ?? (headerList.get("host") ? `https://${headerList.get("host")}` : null);
  const origin = resolveOrigin(headerOrigin);

  try {
    const session = await getDodoClient().checkoutSessions.create({
      product_cart: [{ product_id: DODO_PRODUCT_ID, quantity: 1 }],
      customer: user.email ? { email: user.email } : undefined,
      return_url: `${origin}/checkout/success`,
      metadata: { user_id: user.id },
    });
    return { checkoutUrl: session.checkout_url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start checkout." };
  }
}
