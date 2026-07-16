import "server-only";
import DodoPayments from "dodopayments";

let client: DodoPayments | null = null;

export function getDodoClient() {
  if (client) return client;
  client = new DodoPayments({
    bearerToken: process.env.DODO_API_KEY!,
    environment:
      process.env.NEXT_PUBLIC_DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  });
  return client;
}

/** The one-time 60-Day Program purchase - created once in the Dodo dashboard. */
export const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID!;
