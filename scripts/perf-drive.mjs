#!/usr/bin/env node
/**
 * Drives every page of the app against a running server and reports what
 * each one costs, end to end. Pair it with `PROFILE=1` on the server: this
 * script gives the outside view (what the browser waits for), the server log
 * gives the inside view (which function owned that time).
 *
 * Usage:
 *   node scripts/perf-drive.mjs [--base http://localhost:3000] [--runs 8]
 *                               [--day 45] [--keep] [--json out.json]
 *                               [--cookie "sb-...=..."]
 *
 * Every run creates its own seeded anonymous account and deletes it at the
 * end (unless --keep), so numbers are comparable across runs instead of
 * drifting with whatever data happened to be in the account.
 *
 * `--cookie` skips seeding and drives an existing session instead. That is
 * the only way to measure a deployment that does not have PROFILE=1 (a real
 * production build, where the seeding endpoint deliberately 404s): sign in
 * through the actual UI, hand the session cookie over, and the timings are
 * still comparable because the request path is identical.
 */

import { writeFileSync } from "node:fs";

const args = parseArgs(process.argv.slice(2));
const BASE = args.base ?? "http://localhost:3000";
const RUNS = Number(args.runs ?? 8);
const DAY = Number(args.day ?? 45);

/** Pages worth timing, in the order she'd actually walk through them. */
const ROUTES = [
  { path: "/", note: "root redirect" },
  { path: "/home", note: "the screen she opens every day" },
  { path: "/calendar", note: "60-day grid + slip decryption" },
  { path: "/journal", note: "today's prompt + full history" },
  { path: "/record", note: "every entry, 3 decrypts each" },
  { path: "/vault", note: "unsent drafts" },
  { path: "/settings", note: "one profile row" },
  { path: "/milestones/30", note: "milestone celebration" },
  { path: "/why", note: "static marketing copy" },
  { path: "/panic/timer", note: "client-rendered urge timer" },
];

async function main() {
  console.log(`▶ profiling ${BASE} · ${RUNS} runs per route · seeded at day ${DAY}\n`);

  const { cookie, userId } = args.cookie
    ? { cookie: args.cookie, userId: null }
    : await seedSession();
  console.log(userId ? `  seeded user ${userId}\n` : `  driving a supplied session\n`);

  const results = [];
  try {
    for (const route of ROUTES) {
      // One warmup that is not measured: the first hit compiles/JITs the
      // route and would otherwise dominate the percentiles.
      await timeRequest(route.path, cookie, "document");

      const document = [];
      const rsc = [];
      for (let i = 0; i < RUNS; i++) {
        document.push(await timeRequest(route.path, cookie, "document"));
        rsc.push(await timeRequest(route.path, cookie, "rsc"));
      }
      const row = {
        path: route.path,
        note: route.note,
        document: summarize(document),
        rsc: summarize(rsc),
      };
      results.push(row);
      printRow(row);
    }
  } finally {
    if (userId && !args.keep) await cleanup(userId);
  }

  console.log(`\n${"─".repeat(96)}`);
  console.log(
    `${"route".padEnd(20)}${"doc p50".padStart(10)}${"doc p95".padStart(10)}` +
      `${"ttfb p50".padStart(10)}${"rsc p50".padStart(10)}${"proxy".padStart(9)}` +
      `${"pxyAuth".padStart(9)}${"bytes".padStart(10)}  status`,
  );
  for (const row of results) {
    console.log(
      row.path.padEnd(20) +
        `${row.document.p50.toFixed(0)}ms`.padStart(10) +
        `${row.document.p95.toFixed(0)}ms`.padStart(10) +
        `${row.document.ttfbP50.toFixed(0)}ms`.padStart(10) +
        `${row.rsc.p50.toFixed(0)}ms`.padStart(10) +
        `${row.document.proxyP50.toFixed(0)}ms`.padStart(9) +
        `${row.document.proxyAuthP50.toFixed(0)}ms`.padStart(9) +
        `${(row.document.bytes / 1024).toFixed(1)}kB`.padStart(10) +
        `  ${row.document.status}`,
    );
  }

  if (args.json) {
    writeFileSync(args.json, JSON.stringify({ base: BASE, runs: RUNS, day: DAY, results }, null, 2));
    console.log(`\nwrote ${args.json}`);
  }
}

async function seedSession() {
  const response = await fetch(`${BASE}/api/perf/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ day: DAY }),
  });
  if (!response.ok) {
    throw new Error(
      `seeding failed (${response.status}). Is the server running with PROFILE=1? ` +
        `Body: ${await response.text()}`,
    );
  }
  const setCookies = response.headers.getSetCookie();
  if (setCookies.length === 0) throw new Error("seeding returned no session cookies");

  const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  const { userId } = await response.json();
  return { cookie, userId };
}

async function cleanup(userId) {
  const response = await fetch(`${BASE}/api/perf/session`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  console.log(
    response.ok ? `\n  cleaned up user ${userId}` : `\n  cleanup failed: ${await response.text()}`,
  );
}

/**
 * `kind: "rsc"` mimics an in-app tab switch (the App Router's flight
 * request) rather than a cold document load. The gap between the two is the
 * cost of shipping HTML, fonts, and the client bundle.
 */
async function timeRequest(path, cookie, kind) {
  const started = performance.now();
  const response = await fetch(`${BASE}${path}${kind === "rsc" ? "?_rsc=perf" : ""}`, {
    headers: {
      cookie,
      ...(kind === "rsc" ? { RSC: "1" } : { accept: "text/html" }),
    },
    redirect: "manual",
  });
  const ttfb = performance.now() - started;
  const body = await response.arrayBuffer();
  return {
    total: performance.now() - started,
    ttfb,
    bytes: body.byteLength,
    status: response.status,
    ...parseServerTiming(response.headers.get("server-timing")),
  };
}

/** The middleware reports its own cost this way - it runs outside the profile. */
function parseServerTiming(header) {
  if (!header) return { proxy: 0, proxyAuth: 0 };
  const durations = {};
  for (const part of header.split(",")) {
    const [name, ...rest] = part.trim().split(";");
    const dur = rest.find((r) => r.trim().startsWith("dur="));
    if (dur) durations[name.trim()] = Number(dur.split("=")[1]);
  }
  return { proxy: durations.proxy ?? 0, proxyAuth: durations.proxyAuth ?? 0 };
}

function summarize(samples) {
  const totals = samples.map((s) => s.total).sort((a, b) => a - b);
  const ttfbs = samples.map((s) => s.ttfb).sort((a, b) => a - b);
  return {
    p50: percentile(totals, 0.5),
    p95: percentile(totals, 0.95),
    min: totals[0],
    max: totals[totals.length - 1],
    ttfbP50: percentile(ttfbs, 0.5),
    proxyP50: percentile(samples.map((s) => s.proxy).sort((a, b) => a - b), 0.5),
    proxyAuthP50: percentile(samples.map((s) => s.proxyAuth).sort((a, b) => a - b), 0.5),
    bytes: samples[0].bytes,
    status: samples[0].status,
  };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[index];
}

function printRow(row) {
  console.log(
    `  ${row.path.padEnd(18)} doc ${row.document.p50.toFixed(0)}ms ` +
      `(ttfb ${row.document.ttfbP50.toFixed(0)}ms, ${(row.document.bytes / 1024).toFixed(1)}kB) · ` +
      `rsc ${row.rsc.p50.toFixed(0)}ms · ${row.note}`,
  );
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "keep") out.keep = true;
    else out[key] = argv[++i];
  }
  return out;
}

await main();
