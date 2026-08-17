/**
 * Next.js calls this once per server process, before any request is handled.
 * It's the only place a global fetch patch can be installed early enough to
 * catch the first request's Supabase calls.
 *
 * Everything is behind `PROFILE=1` and a dynamic import, so a normal
 * production build never loads the profiler at all.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.PROFILE !== "1") return;

  const [{ instrumentFetch }, { installPerfSinks }] = await Promise.all([
    import("@/lib/perf/instrument-fetch"),
    import("@/lib/perf/sinks"),
  ]);

  instrumentFetch();
  installPerfSinks();

  console.log(`⏱ profiling on · log ${process.env.PERF_LOG ?? "(console only)"}`);
}
