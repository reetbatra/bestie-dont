"use client";

import { useMemo, useSyncExternalStore } from "react";

type Area = "local" | "session";

function storageFor(area: Area): Storage {
  return area === "local" ? window.localStorage : window.sessionStorage;
}

// The `storage` event only fires for changes made in *other* tabs, which is
// exactly the external change this store needs to hear about; writes in this
// tab happen alongside state updates that already re-render.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * Reads a JSON value from local/session storage without the
 * read-in-useEffect-then-setState double render, and without a hydration
 * mismatch: the server snapshot is always `null`, the client reads storage
 * on its first render.
 *
 * Returns `null` when the key is missing, storage is unavailable (private
 * mode throws on access), or the stored value isn't valid JSON. Every caller
 * treats stored data as an optional nicety (an offline cache, a recap), so
 * "nothing stored" is the correct answer in all three cases.
 */
export function useStoredJson<T>(area: Area, key: string): T | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return storageFor(area).getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );

  // Parse once per distinct string. The snapshot is the raw string (stable
  // across renders) rather than the parsed object, which would be a new
  // object every read and make useSyncExternalStore loop.
  return useMemo(() => {
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [raw]);
}
