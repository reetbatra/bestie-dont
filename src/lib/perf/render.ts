import "server-only";
import type { PerfRecord, PerfSpan } from "@/lib/perf/profiler";

/**
 * Renders one request profile as a gantt chart in the server log. The bar
 * positions are what make the output worth reading: two queries drawn on
 * top of each other ran inside one Promise.all, two drawn end to end are a
 * waterfall you're paying for twice.
 */

const TRACK_WIDTH = 44;

const DIM = "[2m";
const BOLD = "[1m";
const RESET = "[0m";

const CAT_COLOR: Record<string, string> = {
  page: "[35m", // magenta
  action: "[35m",
  auth: "[33m", // yellow
  db: "[36m", // cyan
  http: "[34m", // blue
  crypto: "[32m", // green
  compute: "[90m", // grey
  seed: "[90m",
};

const useColor = process.env.NO_COLOR !== "1" && process.env.VERCEL !== "1";

function paint(text: string, code: string): string {
  return useColor ? `${code}${text}${RESET}` : text;
}

function bar(span: PerfSpan, totalMs: number): string {
  if (totalMs <= 0) return "";
  const scale = TRACK_WIDTH / totalMs;
  const startCol = Math.min(TRACK_WIDTH - 1, Math.floor(span.start * scale));
  const width = Math.max(1, Math.round((span.end - span.start) * scale));
  const endCol = Math.min(TRACK_WIDTH, startCol + width);

  const track =
    " ".repeat(startCol) + "█".repeat(endCol - startCol) + " ".repeat(TRACK_WIDTH - endCol);
  return paint(track, CAT_COLOR[span.cat] ?? "");
}

function metaSuffix(span: PerfSpan): string {
  if (span.error) return paint(`  ✗ ${span.error}`, "[31m");
  if (!span.meta) return "";
  const parts = Object.entries(span.meta)
    .filter(([key]) => key !== "totalMs")
    .map(([key, value]) => `${key}=${value}`);
  return parts.length > 0 ? paint(`  ${parts.join(" ")}`, DIM) : "";
}

/**
 * Self time is total minus whatever ran inside it. On a page whose children
 * are all network calls, a large self time is the signal that the cost is
 * in the framework or in your own CPU work rather than the database.
 */
function selfMs(span: PerfSpan, all: PerfSpan[]): number {
  const children = all.filter((s) => s.parentId === span.id);
  if (children.length === 0) return span.end - span.start;

  // Children can overlap (Promise.all), so subtract the union of their
  // intervals rather than the sum, which would go negative.
  const intervals = children
    .map((c) => [c.start, c.end] as const)
    .sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let cursor = -Infinity;
  for (const [start, end] of intervals) {
    const from = Math.max(start, cursor);
    if (end > from) {
      covered += end - from;
      cursor = end;
    }
  }
  return Math.max(0, span.end - span.start - covered);
}

export function formatRecord(record: PerfRecord): string {
  const lines: string[] = [];
  const cold = record.runtime.coldStart ? paint("  [cold start]", "[31m") : "";
  const region = record.runtime.region ? ` ${record.runtime.region}` : "";

  lines.push(
    `\n${paint("⏱ PROFILE", BOLD)} ${paint(record.label, CAT_COLOR[record.cat] ?? "")} ` +
      `${paint(`${record.totalMs}ms`, BOLD)}${region}${cold}`,
  );

  const byId = new Map(record.spans.map((s) => [s.id, s]));
  const depthOf = (span: PerfSpan): number => {
    let depth = 0;
    let parentId = span.parentId;
    while (parentId !== null && depth < 12) {
      const parent = byId.get(parentId);
      if (!parent) break;
      depth += 1;
      parentId = parent.parentId;
    }
    return depth;
  };

  for (const span of record.spans) {
    const depth = depthOf(span);
    const duration = `${(span.end - span.start).toFixed(1)}ms`;
    const self = selfMs(span, record.spans);
    const selfNote =
      self > 1 && self < span.end - span.start - 1 ? paint(` (self ${self.toFixed(1)})`, DIM) : "";
    const label = `${"  ".repeat(depth)}${span.name}`.padEnd(46).slice(0, 46);

    lines.push(
      `  ${bar(span, record.totalMs)} ${paint(duration.padStart(8), BOLD)}${selfNote}  ${label}${metaSuffix(span)}`,
    );
  }

  lines.push(paint(`  ${summarize(record)}`, DIM));
  return lines.join("\n");
}

/**
 * The one-line takeaway: how much of the request was spent waiting on the
 * network vs. burning CPU, and how much of the network time was serialized.
 */
export function summarize(record: PerfRecord): string {
  // Spans that actually crossed the network carry an HTTP status from the
  // fetch patch; auth.getSession only reads the cookie and must not count.
  const network = record.spans.filter(
    (s) => (s.cat === "db" || s.cat === "auth" || s.cat === "http") && s.meta?.status !== undefined,
  );
  const networkUnion = unionMs(network.map((s) => [s.start, s.end]));
  const networkSum = network.reduce((total, s) => total + (s.end - s.start), 0);
  const cryptoMs = record.spans
    .filter((s) => s.cat === "crypto")
    .reduce((total, s) => total + (s.end - s.start), 0);

  const saved = networkSum - networkUnion;
  return (
    `${network.length} network calls · ${networkUnion.toFixed(0)}ms on the wire ` +
    `(${networkSum.toFixed(0)}ms summed, ${saved.toFixed(0)}ms overlapped) · ` +
    `crypto ${cryptoMs.toFixed(1)}ms · ` +
    `other ${(record.totalMs - networkUnion - cryptoMs).toFixed(0)}ms`
  );
}

export function unionMs(intervals: Array<[number, number]>): number {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let cursor = -Infinity;
  for (const [start, end] of sorted) {
    const from = Math.max(start, cursor);
    if (end > from) {
      covered += end - from;
      cursor = end;
    }
  }
  return covered;
}
