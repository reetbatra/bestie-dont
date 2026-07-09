import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "https://*.supabase.co";

const csp = [
  "default-src 'self'",
  // Next.js needs 'unsafe-inline' for its own inline bootstrap scripts and
  // 'unsafe-eval' in dev (Turbopack HMR); Serwist/PWA install code is 'self'.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE_ORIGIN} https://api.dodopayments.com https://test.dodopayments.com`,
  "frame-src https://checkout.dodopayments.com https://test.checkout.dodopayments.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.dodopayments.com https://test.checkout.dodopayments.com",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // microphone=(self) for the voice-input feature (Web Speech API)
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
