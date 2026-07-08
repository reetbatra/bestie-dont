"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [onIOS, setOnIOS] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    setIsInstalled(isStandalone());
    setOnIOS(isIOS());

    const installedHandler = () => setIsInstalled(true);
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
