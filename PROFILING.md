# Profiling

Everything here is off unless `PROFILE=1` is in the environment. A normal
build never loads the profiler, the two `/api/perf` endpoints return 404, and
the browser probe renders nothing.

## Run it

```bash
npm run profile:build          # build with the browser probe enabled
npm run profile                # start with PROFILE=1 and a JSONL log
npm run profile:drive          # walk every page, print percentiles
npm run profile:report         # aggregate the log per page, per function
```

`profile:drive` creates its own anonymous account seeded with 45 days of
realistic data and deletes it when the run finishes, so two runs are
comparable instead of drifting with whatever happened to be in the account.
Add `--keep` to leave it in place, `--runs N` for more samples.

To drive a deployment that is **not** running with `PROFILE=1` (production),
mint a session first, because the seeding endpoint correctly does not exist
there:

```bash
node scripts/perf-session.mjs --day 45 > .perf/session.txt
node scripts/perf-drive.mjs --base https://bestie.reetbatra.com \
     --cookie "$(head -1 .perf/session.txt)"
node scripts/perf-session.mjs --delete <userId>   # always clean up
```

The seeded account is a real row in whatever database `.env.local` points at.
Delete it when you are done.

## What gets measured

**Server** (`src/lib/perf/`). One profile per page render and per Server
Action, printed as a gantt so parallel work looks parallel:

```
⏱ PROFILE page /home 122.9ms
  █                             1.3ms  requireSession
   █████████████████████       59.8ms  db GET streaks
                    ████████   44.1ms  db GET journal_prompts
                    █████████  49.0ms  db GET journal_entries
  5 network calls · 102ms on the wire (245ms summed, 143ms overlapped)
```

- a global `fetch` patch names every Supabase REST and Auth round trip, so
  new queries are covered without touching a call site
- explicit spans wrap `requireSession`/`requireUserId`, `cookies()`, the
  timezone lookup, and every Server Action
- AES field encryption is counted rather than spanned: the call count is what
  matters (`crypto.decrypt ×72`), not 72 sub-millisecond rows
- `proxy.ts` reports itself as a `Server-Timing` header, because middleware
  runs outside any request profile

**Browser** (`src/components/perf/perf-probe.tsx`): TTFB, FCP, LCP, CLS, INP,
long tasks, slow resources, and every App Router RSC fetch, labelled
`navigation` (someone was waiting) or `prefetch` (Next.js speculating).

## Reading the report

`depth` is the number to optimise: the longest chain of database calls where
each one waited for the previous to finish. Five queries at depth 1 cost one
round trip; two queries at depth 2 cost two. `network` is wall clock with at
least one request in flight; `cpu` is everything else - render, decrypt,
framework.

## What it found (August 2026)

Measured against production, seeded day-45 account, client in India, functions
in `bom1`, Supabase in the same neighbourhood:

| page | server p50 (local) | DB calls | depth | production total |
| --- | --- | --- | --- | --- |
| `/` | 1ms | 0 | 0 | 112ms |
| `/settings` | 49ms | 1 | 1 | 112ms |
| `/vault` | 50ms | 1 | 1 | 113ms |
| `/record` | 55ms | 3 | 1 | 123ms |
| `/calendar` | 100ms | 2 | 2 | 143ms |
| `/home` | 100ms | 5 | 2 | 136ms |
| `/journal` | 103ms | 6 | 2 | 156ms |
| `/milestones/[day]` | 139ms | 4 | 2 | 147ms |

Local server times are inflated: this machine is ~45ms from Supabase, a
`bom1` function is ~15ms. Use local numbers for *shape* (how many round trips,
which function owns them) and production numbers for *size*.

Ranked costs:

1. **`proxy.ts` calls `supabase.auth.getUser()` on every request** - one
   Supabase Auth round trip, ~28ms in production, paid by static pages and by
   pages that need no session at all. It is the largest fixed cost in the app.
2. **Second round trips.** `/home`, `/journal`, `/calendar`, and
   `/milestones/[day]` all read the streak row first and then fetch everything
   else, so they pay two round trips instead of one.
3. **`count: "exact", head: true`** on `/milestones/[day]` costs ~86ms locally
   against ~48ms for an ordinary select - an exact count scans.
4. **`/journal` queries `journal_prompts` and `journal_entries` twice each**,
   once in `getTodayJournal` and once in `listJournalHistory`.
5. **Field decryption is free**: 72 decrypts on `/record` total ~1ms.

On the browser side: CLS 0, INP 0, no long tasks, FCP ~450ms in production
(fonts and the client bundle, not data). Tab switches show the skeleton in
~15ms, the RSC payload lands at 120-230ms, and the content is revealed at a
near-constant ~315ms - consistent with React's 300ms Suspense fallback
throttle. Server work faster than ~285ms is therefore invisible on an in-app
tab switch; it only shows up on a cold load.
