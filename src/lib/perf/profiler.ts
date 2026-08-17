import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Request-scoped profiler. Off unless `PROFILE=1` is set in the environment,
 * and every entry point short-circuits to the un-instrumented call when it is
 * off, so this costs nothing in a normal production build.
 *
 * What it answers: for one page render (or one Server Action invocation),
 * which functions ran, in what order, how much of the wall clock each one
 * owned, and which of them actually overlapped instead of stacking up. The
 * last part is why spans carry absolute offsets and get drawn as a gantt -
 * a flat "getTodayJournal: 240ms" list can't tell you whether three 80ms
 * queries ran in parallel or one after another, and that distinction is the
 * whole game on a page whose cost is dominated by database round trips.
 *
 * Two ways in:
 *   - explicit: `span("name", cat, fn)` around a function you care about
 *   - automatic: the global fetch patch in ./instrument-fetch.ts, which
 *     catches every Supabase REST/Auth round trip without a call site edit
 */

export type SpanCategory =
  | "page"
  | "action"
  | "auth"
  | "db"
  | "http"
  | "crypto"
  | "compute"
  | "seed";

export interface PerfSpan {
  id: number;
  parentId: number | null;
  name: string;
  cat: SpanCategory;
  /** ms since the start of the request */
  start: number;
  /** ms since the start of the request */
  end: number;
  meta?: Record<string, string | number | boolean | null>;
  error?: string;
}

export interface PerfRecord {
  kind: "server";
  label: string;
  cat: SpanCategory;
  /** ISO timestamp of when the request started */
  at: string;
  totalMs: number;
  spans: PerfSpan[];
  runtime: {
    node: string;
    region: string | null;
    vercelEnv: string | null;
    deploymentUrl: string | null;
    coldStart: boolean;
  };
}

interface Store {
  label: string;
  cat: SpanCategory;
  startedAt: number;
  startedAtIso: string;
  spans: PerfSpan[];
  nextId: number;
}

/**
 * Bundlers hand each entry point its own copy of a module - the
 * instrumentation hook, a page's route bundle, and a Server Action bundle
 * can all end up with a separate instance of this file. Separate instances
 * mean separate AsyncLocalStorage objects, and a span recorded in one is
 * invisible to a profile opened in another, which shows up as a profiler
 * that silently records nothing. The state lives on globalThis so every
 * copy shares one storage, one sink list, and one cold-start flag.
 */
interface GlobalPerfState {
  storage: AsyncLocalStorage<Store>;
  /**
   * The currently open span, tracked as async context rather than as a stack.
   * A stack is wrong the moment anything runs in a Promise.all: three queries
   * started together would each be recorded as a child of whichever sibling
   * happened to be on top, and the resulting tree blames the wrong function.
   */
  parents: AsyncLocalStorage<number | null>;
  sinks: Sink[];
  servedARequest: boolean;
  sinksInstalled: boolean;
  fetchPatched: boolean;
}

const GLOBAL_KEY = Symbol.for("bestie-dont.perf.state");

function globalState(): GlobalPerfState {
  const container = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: GlobalPerfState;
  };
  container[GLOBAL_KEY] ??= {
    storage: new AsyncLocalStorage<Store>(),
    parents: new AsyncLocalStorage<number | null>(),
    sinks: [],
    servedARequest: false,
    sinksInstalled: false,
    fetchPatched: false,
  };
  return container[GLOBAL_KEY];
}

const state = globalState();
const storage = state.storage;
const parents = state.parents;

function currentParentId(): number | null {
  return parents.getStore() ?? null;
}

export const PROFILING = process.env.PROFILE === "1";

/** Exposed so the fetch patch and the sink installer can dedupe globally too. */
export function perfState(): GlobalPerfState {
  return state;
}

export function isProfiling(): boolean {
  return PROFILING;
}

function now(): number {
  return performance.now();
}

/** Opens a request-scoped profile. Everything awaited inside `fn` reports into it. */
export async function withProfile<T>(
  label: string,
  cat: SpanCategory,
  fn: () => Promise<T>,
): Promise<T> {
  if (!PROFILING) return fn();

  const store: Store = {
    label,
    cat,
    startedAt: now(),
    startedAtIso: new Date().toISOString(),
    spans: [],
    nextId: 1,
  };
  // Cold starts include module init and JIT warmup, and are the single most
  // common reason a "slow page" measurement is unreproducible - worth
  // labelling rather than quietly averaging into everything else.
  const coldStart = !state.servedARequest;
  state.servedARequest = true;

  try {
    return await storage.run(store, () => parents.run(null, fn));
  } finally {
    emit(buildRecord(store, coldStart));
  }
}

function buildRecord(store: Store, coldStart: boolean): PerfRecord {
  const cryptoSpans = drainCryptoAggregate(store);
  return {
    kind: "server",
    label: store.label,
    cat: store.cat,
    at: store.startedAtIso,
    totalMs: round(now() - store.startedAt),
    spans: [...store.spans, ...cryptoSpans].sort((a, b) => a.start - b.start),
    runtime: {
      node: process.version,
      region: process.env.VERCEL_REGION ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      deploymentUrl: process.env.VERCEL_URL ?? null,
      coldStart,
    },
  };
}

/**
 * Times `fn` as a child of whatever span is currently open. A no-op (zero
 * added allocations, zero timing calls) when profiling is off or when the
 * call happens outside a `withProfile` scope - e.g. a Server Action invoked
 * during a render that wasn't wrapped.
 */
export function span<T>(
  name: string,
  cat: SpanCategory,
  fn: () => Promise<T>,
  meta?: PerfSpan["meta"],
): Promise<T> {
  if (!PROFILING) return fn();
  const store = storage.getStore();
  if (!store) return fn();

  const record: PerfSpan = {
    id: store.nextId++,
    parentId: currentParentId(),
    name,
    cat,
    start: round(now() - store.startedAt),
    end: 0,
    ...(meta ? { meta } : {}),
  };
  store.spans.push(record);

  const close = () => {
    record.end = round(now() - store.startedAt);
  };

  return parents.run(record.id, () =>
    fn().then(
      (value) => {
        close();
        return value;
      },
      (error: unknown) => {
        record.error = error instanceof Error ? error.message : String(error);
        close();
        throw error;
      },
    ),
  );
}

/** Synchronous variant, for CPU work like the calendar's slip-mapping loop. */
export function spanSync<T>(
  name: string,
  cat: SpanCategory,
  fn: () => T,
  meta?: PerfSpan["meta"],
): T {
  if (!PROFILING) return fn();
  const store = storage.getStore();
  if (!store) return fn();

  const start = round(now() - store.startedAt);
  const id = store.nextId++;
  try {
    return parents.run(id, fn);
  } finally {
    store.spans.push({
      id,
      parentId: currentParentId(),
      name,
      cat,
      start,
      end: round(now() - store.startedAt),
      ...(meta ? { meta } : {}),
    });
  }
}

/**
 * Records an already-measured interval. Used by the fetch patch, which has
 * to start its own clock before it can name the span (the name comes from
 * the request URL, and there's no reason to parse it twice).
 */
export function addSpan(
  name: string,
  cat: SpanCategory,
  startedAt: number,
  endedAt: number,
  meta?: PerfSpan["meta"],
  error?: string,
): void {
  if (!PROFILING) return;
  const store = storage.getStore();
  if (!store) return;

  store.spans.push({
    id: store.nextId++,
    parentId: currentParentId(),
    name,
    cat,
    start: round(startedAt - store.startedAt),
    end: round(endedAt - store.startedAt),
    ...(meta ? { meta } : {}),
    ...(error ? { error } : {}),
  });
}

export function markStart(): number {
  return now();
}

export function inProfile(): boolean {
  return PROFILING && storage.getStore() !== undefined;
}

/* --------------------------------------------------------------------- */
/* Crypto aggregation                                                     */
/* --------------------------------------------------------------------- */

/**
 * AES-GCM field decryption runs once per encrypted column per row - the
 * Record page decrypts three fields on every entry. Emitting a span per call
 * would bury the request in hundreds of sub-millisecond rows, so calls are
 * counted and rolled into one synthetic span per operation instead. The
 * count is the interesting number: it tells you when a page went from 12
 * decrypts to 400 because a list stopped being paginated.
 */
const cryptoTotals = new WeakMap<Store, Map<string, { count: number; ms: number }>>();

export function countCrypto(op: string, ms: number): void {
  if (!PROFILING) return;
  const store = storage.getStore();
  if (!store) return;

  let totals = cryptoTotals.get(store);
  if (!totals) {
    totals = new Map();
    cryptoTotals.set(store, totals);
  }
  const entry = totals.get(op) ?? { count: 0, ms: 0 };
  entry.count += 1;
  entry.ms += ms;
  totals.set(op, entry);
}

function drainCryptoAggregate(store: Store): PerfSpan[] {
  const totals = cryptoTotals.get(store);
  if (!totals) return [];
  cryptoTotals.delete(store);

  return [...totals.entries()].map(([op, { count, ms }]) => ({
    id: store.nextId++,
    parentId: null,
    name: `crypto.${op} ×${count}`,
    cat: "crypto" as const,
    // Crypto time is scattered across the request rather than contiguous;
    // it is drawn as a summed block at the end so the number is readable
    // without pretending it occupied one continuous stretch of wall clock.
    start: round(now() - store.startedAt - ms),
    end: round(now() - store.startedAt),
    meta: { calls: count, totalMs: round(ms), perCallMs: round(ms / count) },
  }));
}

/* --------------------------------------------------------------------- */
/* Emission                                                               */
/* --------------------------------------------------------------------- */

type Sink = (record: PerfRecord) => void;

export function addSink(sink: Sink): void {
  state.sinks.push(sink);
}

function emit(record: PerfRecord): void {
  for (const sink of state.sinks) sink(record);
}

export function round(ms: number): number {
  return Math.round(ms * 10) / 10;
}
