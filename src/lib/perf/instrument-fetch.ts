import "server-only";
import { addSpan, markStart, perfState, PROFILING, type SpanCategory } from "@/lib/perf/profiler";

/**
 * Patches the global fetch so every outbound HTTP call from a profiled
 * request shows up in the waterfall without a call-site edit. supabase-js
 * goes through fetch for every query, insert, and auth call, so this is
 * where the app's real latency becomes visible: one patch, complete
 * coverage, and it keeps working when a new query is added.
 *
 * Filter *names* are recorded, filter *values* are not. Query values here
 * are user ids, slip ids, and dates - the point is to identify which query
 * ran, not to write anyone's data into a log file.
 */

export function instrumentFetch(): void {
  const state = perfState();
  if (!PROFILING || state.fetchPatched) return;
  state.fetchPatched = true;

  const original = globalThis.fetch;

  globalThis.fetch = async function profiledFetch(
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> {
    const started = markStart();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method =
      init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET");

    try {
      const response = await original(input as RequestInfo, init);
      const { name, cat, meta } = describe(url, method ?? "GET");
      addSpan(name, cat, started, markStart(), {
        ...meta,
        status: response.status,
        bytes: Number(response.headers.get("content-length") ?? 0),
      });
      return response;
    } catch (error) {
      const { name, cat, meta } = describe(url, method ?? "GET");
      addSpan(
        name,
        cat,
        started,
        markStart(),
        meta,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  } as typeof fetch;
}

interface Described {
  name: string;
  cat: SpanCategory;
  meta: Record<string, string | number | boolean | null>;
}

const AUTH_ENDPOINT_NAMES: Record<string, string> = {
  user: "auth.getUser",
  token: "auth.refreshToken",
  signup: "auth.signUp",
  logout: "auth.signOut",
  otp: "auth.signInWithOtp",
};

function describe(rawUrl: string, method: string): Described {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { name: `http ${method} ${rawUrl}`, cat: "http", meta: {} };
  }

  const supabaseHost = supabaseOrigin();
  const isSupabase = supabaseHost !== null && url.origin === supabaseHost;

  if (isSupabase && url.pathname.startsWith("/rest/v1/")) {
    const table = url.pathname.slice("/rest/v1/".length) || "(root)";
    const filters = [...url.searchParams.keys()].filter((k) => k !== "select");
    const select = url.searchParams.get("select");
    return {
      name: `db ${method} ${table}`,
      cat: "db",
      meta: {
        ...(filters.length > 0 ? { filters: filters.join(",") } : {}),
        ...(select ? { cols: select.length > 40 ? `${select.slice(0, 37)}…` : select } : {}),
      },
    };
  }

  if (isSupabase && url.pathname.startsWith("/auth/v1/")) {
    const endpoint = url.pathname.slice("/auth/v1/".length).split("/")[0];
    return {
      name: AUTH_ENDPOINT_NAMES[endpoint] ?? `auth ${method} ${endpoint}`,
      cat: "auth",
      meta: {},
    };
  }

  return { name: `http ${method} ${url.host}${url.pathname}`, cat: "http", meta: {} };
}

let cachedOrigin: string | null | undefined;

function supabaseOrigin(): string | null {
  if (cachedOrigin !== undefined) return cachedOrigin;
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) {
    cachedOrigin = null;
    return cachedOrigin;
  }
  cachedOrigin = new URL(raw).origin;
  return cachedOrigin;
}
