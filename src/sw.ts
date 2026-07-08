/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
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
    ...defaultCache,
  ],
});

serwist.addEventListeners();
