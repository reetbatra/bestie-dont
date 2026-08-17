import "server-only";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { addSink, perfState, PROFILING, type PerfRecord } from "@/lib/perf/profiler";
import { formatRecord } from "@/lib/perf/render";
import type { ClientPerfRecord } from "@/lib/perf/types";

/**
 * Where profiles go. Two destinations, both optional:
 *
 *   - the server log, as a gantt chart, for reading while you drive the app
 *   - a JSONL file (`PERF_LOG=.perf/profile.jsonl`), for aggregating many
 *     runs into percentiles with `node scripts/perf-report.mjs`
 *
 * On Vercel the filesystem is read-only outside /tmp, so the file sink is
 * expected to be unset there and the log sink carries everything.
 */

export function installPerfSinks(): void {
  const state = perfState();
  if (!PROFILING || state.sinksInstalled) return;
  state.sinksInstalled = true;

  const quiet = process.env.PERF_QUIET === "1";
  if (!quiet) {
    addSink((record) => {
      console.log(formatRecord(record));
    });
  }

  const logPath = process.env.PERF_LOG;
  if (logPath) {
    prepareLogFile(logPath);
    addSink((record) => appendRecord(logPath, record));
  }
}

function prepareLogFile(logPath: string): void {
  mkdirSync(dirname(logPath), { recursive: true });
}

/**
 * Deliberately not wrapped in a try/catch: a profiler that silently stops
 * recording is worse than one that crashes the request it was measuring,
 * because you only find out after you've thrown away the run.
 */
function appendRecord(logPath: string, record: PerfRecord | ClientPerfRecord): void {
  appendFileSync(logPath, `${JSON.stringify(record)}\n`, "utf8");
}

/** Called by the /api/perf collector for metrics measured in the browser. */
export function recordClientProfile(record: ClientPerfRecord): void {
  const logPath = process.env.PERF_LOG;
  if (logPath) {
    prepareLogFile(logPath);
    appendRecord(logPath, record);
  }
  if (process.env.PERF_QUIET !== "1") {
    console.log(formatClientRecord(record));
  }
}

function formatClientRecord(record: ClientPerfRecord): string {
  const metrics = record.metrics
    .map((m) => `${m.name}=${m.value.toFixed(m.value < 10 ? 2 : 0)}`)
    .join("  ");
  const slow = (record.resources ?? [])
    .slice(0, 3)
    .map((r) => `${r.name} ${r.ms.toFixed(0)}ms`)
    .join(", ");
  return (
    `\n⏱ CLIENT  ${record.label}  [${record.navigationType}]\n  ${metrics}` +
    (slow ? `\n  slowest resources: ${slow}` : "")
  );
}
