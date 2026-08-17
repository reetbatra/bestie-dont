/**
 * Shapes shared between the browser probe and the server collector. No
 * `server-only` here on purpose - the client component imports these types.
 */

export interface ClientMetric {
  name: string;
  value: number;
  /** Extra identifying detail, e.g. the element an LCP or INP was attributed to. */
  detail?: string;
}

export interface ClientPerfRecord {
  kind: "client";
  /** Pathname the metrics belong to. */
  label: string;
  at: string;
  /** "hard" = full document load, "soft" = client-side App Router navigation. */
  navigationType: "hard" | "soft";
  metrics: ClientMetric[];
  /** Slow individual resources (fonts, chunks) for this navigation. */
  resources?: Array<{ name: string; ms: number; bytes: number; type: string }>;
  viewport?: { width: number; height: number };
  connection?: { effectiveType: string; rtt: number; downlink: number } | null;
}
