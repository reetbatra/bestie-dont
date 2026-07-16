# bestie, don't.

The friend who takes your phone. A web-first PWA that helps women hold a no-contact boundary after a breakup: streak with repair, panic button (somatic reset → 20-minute urge timer → resist card), Receipts, Vault, an 8-week journal arc, and a one-time 60-day program purchase.

Full technical architecture: see the plan doc from the initial build session (stack decisions, data model, PWA/offline strategy, cost ledger).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres + Auth with anonymous sign-in + Row Level Security)
- Dodo Payments (one-time checkout, no subscriptions)
- Serwist (offline-capable PWA service worker)
- Server-side AES-256-GCM field encryption for anything that names or describes a third party

## Getting started

```bash
pnpm install
cp .env.local.example .env.local   # fill in Supabase / Dodo / Resend keys yourself
pnpm dev
```

Run `supabase/migrations/0001_init.sql` against your Supabase project's SQL editor, and enable Anonymous Sign-Ins under Authentication → Sign In / Providers.

## Scripts

- `pnpm dev` - local dev server (service worker disabled in dev)
- `pnpm build` / `pnpm start` - production build and serve
- `node scripts/gen-icons.mjs` - regenerate the app icon set from the brand mark
