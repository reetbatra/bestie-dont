"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isIOS, isStandalone } from "@/lib/platform";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const InstallContext = createContext<InstallContextValue>({
  canInstall: false,
  isInstalled: false,
  isIOS: false,
  promptInstall: async () => "unavailable",
});

export function useInstallPrompt() {
  return useContext(InstallContext);
}

// The platform never changes during a session; nothing to subscribe to.
const subscribeNever = () => () => {};

// Re-check standalone mode when the display mode flips (e.g. the app gets
// opened from the home screen in the same browser session).
function subscribeDisplayMode(onChange: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  // Server snapshots are `false`: the server can't know, and the client
  // corrects it on its first render without a mismatch.
  const onIOS = useSyncExternalStore(subscribeNever, isIOS, () => false);
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);
  // Installing from a browser tab fires `appinstalled` but the tab itself
  // stays non-standalone, so that case needs its own flag.
  const [justInstalled, setJustInstalled] = useState(false);
  const isInstalled = standalone || justInstalled;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setJustInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function promptInstall() {
    if (!deferredEvent) return "unavailable" as const;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    setDeferredEvent(null);
    return outcome;
  }

  return (
    <InstallContext.Provider
      value={{ canInstall: deferredEvent !== null, isInstalled, isIOS: onIOS, promptInstall }}
    >
      {children}
    </InstallContext.Provider>
  );
}
