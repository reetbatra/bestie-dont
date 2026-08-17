import { NextResponse } from "next/server";
import { PROFILING } from "@/lib/perf/profiler";
import { recordClientProfile } from "@/lib/perf/sinks";
import type { ClientPerfRecord } from "@/lib/perf/types";

/**
 * Collector for browser-measured metrics. Returns 404 unless PROFILE=1, so
 * a normal production deployment has no such endpoint at all - it accepts
 * unauthenticated writes to a log file, which is fine for a profiling run
 * and not fine for anything else.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!PROFILING) return new NextResponse("Not found", { status: 404 });

  const record = (await request.json()) as ClientPerfRecord;
  if (record?.kind !== "client" || typeof record.label !== "string") {
    return NextResponse.json({ error: "Malformed client perf record" }, { status: 400 });
  }

  recordClientProfile(record);
  return new NextResponse(null, { status: 204 });
}
