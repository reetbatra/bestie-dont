"use server";

import { createClient } from "@/lib/supabase/server";
import { getDodoClient, DODO_PRODUCT_ID } from "@/lib/dodo";
import { requestOrigin } from "@/lib/origin";

export async function startCheckout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No session." };

  const origin = await requestOrigin();

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
