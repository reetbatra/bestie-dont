"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { ClientMetric, ClientPerfRecord } from "@/lib/perf/types";

/**
 * Browser half of the profiler. The server profile ends when the HTML is
 * flushed; everything the user actually waits for after that - the RSC
 * payload for a tab switch, font loading, hydration, the first paint that
 * counts - only exists here.
 *
 * Rendered only when NEXT_PUBLIC_PROFILE=1, and the whole component tree
 * short-circuits to null otherwise, so it never ships behaviour to real
 * users.
 *
 * Metrics collected, and why each one:
 *   TTFB        server time as the browser saw it, including the network
 *   FCP / LCP   when she sees anything / when she sees the main thing
 *   CLS / INP   whether it jumps around and whether taps feel instant
 *   rsc         the App Router fetch behind every in-app tab switch - this
 *               is the number that reads as "laggy navigation"
 *   longtask    main-thread blocks over 50ms, i.e. hydration cost
 */

const ENABLED = process.env.NEXT_PUBLIC_PROFILE === "1";
const ENDPOINT = "/api/perf";

interface PendingRsc {
  path: string;
  record: ClientPerfRecord;
  wasNavigation: boolean;
}

export function PerfProbe() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const bootstrapped = useRef(false);
  /**
   * RSC fetches are held here briefly before being reported. The fetch
   * completes before the router commits the new URL, so at observation time
   * there is no way to know whether anyone was waiting on it. Waiting for
   * the pathname to change - or not - is what settles it.
   */
  const pendingRef = useRef<PendingRsc[]>([]);

  useEffect(() => {
    pathnameRef.current = pathname;
    for (const pending of pendingRef.current) {
      if (pending.path === pathname) pending.wasNavigation = true;
    }
  }, [pathname]);

  useEffect(() => {
    if (!ENABLED || bootstrapped.current) return;
    bootstrapped.current = true;

    const send = (record: ClientPerfRecord) => {
      const body = JSON.stringify(record);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      } else {
        void fetch(ENDPOINT, { method: "POST", body, keepalive: true });
      }
      // Also surface it in the browser console, so a human driving the app
      // sees the same numbers the log file gets.
      console.info(`⏱ ${record.label} [${record.navigationType}]`, record.metrics);
    };

    const base = (navigationType: ClientPerfRecord["navigationType"]): ClientPerfRecord => ({
      kind: "client",
      label: pathnameRef.current,
      at: new Date().toISOString(),
      navigationType,
      metrics: [],
      viewport: { width: window.innerWidth, height: window.innerHeight },
      connection: readConnection(),
    });

    const observers: PerformanceObserver[] = [];
    const observe = (type: string, callback: (list: PerformanceObserverEntryList) => void, extra?: PerformanceObserverInit) => {
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
      const observer = new PerformanceObserver(callback);
      observer.observe({ type, buffered: true, ...extra });
      observers.push(observer);
    };

    /* ---- hard navigation: one summary flushed when the page is hidden ---- */

    let lcp = 0;
    let lcpElement = "";
    let cls = 0;
    let inp = 0;
    let inpTarget = "";
    let longTaskMs = 0;
    let longTaskCount = 0;

    observe("largest-contentful-paint", (list) => {
      const entries = list.getEntries();
      const latest = entries[entries.length - 1] as PerformanceEntry & { element?: Element };
      if (!latest) return;
      lcp = latest.startTime;
      lcpElement = describeElement(latest.element);
    });

    observe("layout-shift", (list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
    });

    observe(
      "event",
      (list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number; target?: Element }>) {
          if (entry.duration > inp) {
            inp = entry.duration;
            inpTarget = describeElement(entry.target);
          }
        }
      },
      { durationThreshold: 40 } as PerformanceObserverInit,
    );

    observe("longtask", (list) => {
      for (const entry of list.getEntries()) {
        longTaskMs += entry.duration;
        longTaskCount += 1;
      }
    });

    /* ---- soft navigation: every App Router RSC fetch, reported live ---- */

    // Next.js prefetches links that come into view, so most RSC requests are
    // speculative and nobody is waiting on them. Mixing those into the tab
    // switch numbers would flatter them: a prefetch that finished while the
    // user was still reading costs nobody anything.
    const settleRsc = (pending: PendingRsc) => {
      pendingRef.current = pendingRef.current.filter((item) => item !== pending);
      pending.record.metrics[0].detail = pending.wasNavigation ? "navigation" : "prefetch";
      send(pending.record);
    };

    observe("resource", (list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        if (!entry.name.includes("_rsc=")) continue;
        const url = new URL(entry.name);

        const record = base("soft");
        record.label = url.pathname;
        record.metrics = [
          { name: "rsc", value: entry.duration },
          { name: "rsc.ttfb", value: entry.responseStart - entry.startTime },
          { name: "rsc.download", value: entry.responseEnd - entry.responseStart },
          { name: "rsc.bytes", value: entry.transferSize },
        ];

        const pending: PendingRsc = {
          path: url.pathname,
          record,
          wasNavigation: url.pathname === pathnameRef.current,
        };
        pendingRef.current.push(pending);
        window.setTimeout(() => settleRsc(pending), 1500);
      }
    });

    let flushedHardNavigation = false;
    const flushHardNavigation = () => {
      // Both the settle timer and the visibility handler can fire; the
      // document-load metrics are final either way, and sending them twice
      // just double-counts this page in the percentiles.
      if (flushedHardNavigation) return;
      flushedHardNavigation = true;

      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((p) => p.name === "first-contentful-paint");

      const metrics: ClientMetric[] = [];
      if (nav) {
        metrics.push(
          { name: "ttfb", value: nav.responseStart - nav.requestStart },
          { name: "html.download", value: nav.responseEnd - nav.responseStart },
          { name: "dom.interactive", value: nav.domInteractive },
          { name: "dom.contentLoaded", value: nav.domContentLoadedEventEnd },
          { name: "load", value: nav.loadEventEnd },
        );
      }
      if (fcp) metrics.push({ name: "fcp", value: fcp.startTime });
      if (lcp) metrics.push({ name: "lcp", value: lcp, detail: lcpElement });
      metrics.push({ name: "cls", value: Number(cls.toFixed(4)) });
      if (inp) metrics.push({ name: "inp", value: inp, detail: inpTarget });
      metrics.push({ name: "longtask.ms", value: longTaskMs, detail: `${longTaskCount} tasks` });

      const record = base("hard");
      record.label = window.location.pathname;
      record.metrics = metrics;
      record.resources = slowestResources();
      send(record);
    };

    const onHidden = () => {
      if (document.visibilityState === "hidden") flushHardNavigation();
    };
    document.addEventListener("visibilitychange", onHidden);
    // Belt and braces for the driver script, which never hides the page:
    // flush once the load event has settled.
    const settleTimer = window.setTimeout(flushHardNavigation, 3000);

    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.clearTimeout(settleTimer);
      for (const observer of observers) observer.disconnect();
    };
  }, []);

  return null;
}

function describeElement(element: Element | undefined | null): string {
  if (!element) return "";
  const id = element.id ? `#${element.id}` : "";
  const cls = typeof element.className === "string" && element.className
    ? `.${element.className.split(/\s+/).slice(0, 2).join(".")}`
    : "";
  return `${element.tagName.toLowerCase()}${id}${cls}`;
}

function readConnection(): ClientPerfRecord["connection"] {
  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType: string; rtt: number; downlink: number };
    }
  ).connection;
  if (!connection) return null;
  return {
    effectiveType: connection.effectiveType,
    rtt: connection.rtt,
    downlink: connection.downlink,
  };
}

function slowestResources() {
  return (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
    .filter((entry) => entry.duration > 30)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 6)
    .map((entry) => ({
      name: new URL(entry.name).pathname.split("/").slice(-2).join("/"),
      ms: Math.round(entry.duration),
      bytes: entry.transferSize,
      type: entry.initiatorType,
    }));
}
