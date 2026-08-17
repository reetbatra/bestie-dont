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

## What it found, and what changed (August 2026)

The app was never slow because of the work it does. It was slow because of how
many times it waited. Production, warm, seeded day-45 account, client in India,
functions in `bom1`:

| page | before | after | |
| --- | --- | --- | --- |
| `/why` (static) | 77ms | 59ms | -23% |
| `/` (redirect) | 112ms | 89ms | -21% |
| `/settings` | 112ms | 99ms | -12% |
| `/vault` | 113ms | 96ms | -15% |
| `/record` | 123ms | 101ms | -18% |
| `/home` | 136ms | 102ms | -25% |
| `/calendar` | 143ms | 101ms | -29% |
| `/milestones/30` | 147ms | 100ms | -32% |
| `/journal` | 156ms | 103ms | -34% |

Every data page now lands within 7ms of every other one, because every page is
now the same shape: one round trip, then render. About 59ms of what remains is
network to the edge from this client's location, which leaves roughly 40ms of
actual server time per page.

Server-side, local (inflated by ~30ms per round trip, since this machine is
further from Supabase than a Vercel function is - read the shape, not the size):

| page | before | after | DB calls | depth |
| --- | --- | --- | --- | --- |
| `/settings` | 49ms | 48ms | 1 | 1 |
| `/vault` | 50ms | 52ms | 1 | 1 |
| `/record` | 55ms | 52ms | 3 | 1 |
| `/calendar` | 100ms | 49ms | 2 | 1 |
| `/home` | 100ms | 53ms | 5 | 1 |
| `/journal` | 103ms | 53ms | 4 | 1 |
| `/milestones/[day]` | 139ms | 50ms | 4 | 1 |

### What was changed

1. **The proxy stopped re-authenticating every request.** `proxy.ts` called
   `supabase.auth.getUser()`, a round trip to Supabase Auth on every request
   the matcher covers - static pages included. `getSession()` refreshes the
   same tokens (both act inside auth-js's 90s `EXPIRY_MARGIN_MS`) but only
   touches the network when there is something to refresh. Measured: 0.2ms on
   an ordinary request, 115ms on one carrying a deliberately expired token,
   which then wrote fresh cookies and rendered normally.
2. **The streak-row dependency is gone.** `/home`, `/journal`, `/calendar` and
   `/milestones/[day]` each read one row and then waited for it. `journal_prompts`
   is 56 fixed rows and a user's journal entries are at most 56 day numbers, so
   both load whole in the first wave and the day arithmetic picks from them in
   memory. `/calendar` fetches slips by `user_id` and narrows to the active
   streak in memory instead of waiting to filter by `streak_id`.
3. **`getTodayJournal` + `listJournalHistory` became `getJournalScreen`.** They
   were reading `journal_prompts` and `journal_entries` twice between them: six
   queries for one screen, now four in a single wave.
4. **Exact counts replaced with bounded reads.** `count: "exact", head: true`
   measured ~86ms against ~48ms for reading the same rows - an exact count
   scans. Both sets are bounded by what one person can write.
5. **The milestone upsert stopped repeating.** Re-opening a milestone card used
   to write a row that could not change anything; the first wave now reads
   whether it is already recorded.

### What was left alone

- **Consolidating each page into one Postgres function.** It would take the
  remaining round trip to zero, but it needs a migration applied to the hosted
  database, which is a deploy step this codebase does not have automated.
- **Indexes.** Same reason. Worth checking `receipts(user_id)` and
  `journal_entries(user_id)` are indexed, since the exact-count scans hinted
  they may not be.
- **The ~300ms floor on in-app tab switches.** The skeleton appears in ~15ms
  and the RSC payload now lands at 71-90ms (it was 118-227ms), but content is
  still revealed at a near-constant ~315ms: React throttles a Suspense reveal
  for 300ms once a fallback has been shown, so the flash is avoided. Deleting
  `loading.tsx` would collapse a tab switch to ~100ms, but it trades a
  guaranteed instant acknowledgement for a page that looks frozen whenever the
  network is slow - a bad trade for the phone-on-4G audience this is for. The
  win from the server work shows up on cold loads and first paint instead.
- **Fonts and bundle size.** FCP is ~450ms in production and it is fonts and
  the client bundle, not data. CLS is 0, INP is 0, and no long task blocks the
  main thread, so there was nothing broken to fix here - only a different piece
  of work.

### One consequence worth knowing

With `getSession()` in the proxy, a user whose account is deleted server-side
keeps a syntactically valid JWT until it expires (up to an hour). Every query
they make returns nothing, because RLS finds no rows - they land in onboarding.
Self-service account deletion signs the session out immediately, so this only
applies to a deletion made behind the user's back, and it costs them access to
nothing but their own already-deleted data.
