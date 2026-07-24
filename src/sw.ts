/// <reference lib="webworker" />
import { defaultCache, PAGES_CACHE_NAME } from "@serwist/turbopack/worker";
import { Serwist, NetworkFirst, CacheFirst, ExpirationPlugin } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // The panic flow is the one part of the app that has to work with zero
    // signal (1am, hotel wifi, dead zone). Cache-first with a background
    // revalidate means it renders instantly from cache and still picks up
    // fresh data the moment a connection is available.
    {
      matcher: ({ url }: { url: URL }) =>
        url.pathname === "/panic/reset" ||
        url.pathname === "/panic/timer" ||
        url.pathname === "/panic/done" ||
        url.pathname === "/home",
      handler: new NetworkFirst({
        cacheName: "panic-flow-pages",
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 7 })],
      }),
    },
    {
      matcher: ({ request }: { request: Request }) =>
        request.destination === "font" || request.destination === "style",
      handler: new CacheFirst({
        cacheName: "static-assets",
        plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 })],
      }),
    },
    // Every screen here is also a PWA launch target (home screen icon, the
    // "Log a slip" shortcut straight to /calendar) - each launch is a cold
    // WebView with no warm connection, checked as often on a dead-zone
    // cellular signal as on good wifi. @serwist's default NetworkFirst for
    // pages has no timeout, so a slow connection just hangs waiting for the
    // network instead of falling back to the last-seen page. These three
    // mirror @serwist's own RSC-prefetch/RSC/HTML matchers (same cache
    // names, so nothing gets orphaned) but bound the wait to 3s - a bad
    // connection gets the cached page almost immediately, a good one still
    // always gets fresh data since network wins whenever it's fast.
    {
      matcher: ({ request, url: { pathname }, sameOrigin }: { request: Request; url: URL; sameOrigin: boolean }) =>
        request.headers.get("RSC") === "1" &&
        request.headers.get("Next-Router-Prefetch") === "1" &&
        sameOrigin &&
        !pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE_NAME.rscPrefetch,
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 1440 * 60 })],
      }),
    },
    {
      matcher: ({ request, url: { pathname }, sameOrigin }: { request: Request; url: URL; sameOrigin: boolean }) =>
        request.headers.get("RSC") === "1" && sameOrigin && !pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE_NAME.rsc,
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 1440 * 60 })],
      }),
    },
    {
      matcher: ({ request, url: { pathname }, sameOrigin }: { request: Request; url: URL; sameOrigin: boolean }) =>
        (request.headers.get("Content-Type")?.includes("text/html") ?? false) &&
        sameOrigin &&
        !pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE_NAME.html,
        networkTimeoutSeconds: 3,
        plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 1440 * 60 })],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
