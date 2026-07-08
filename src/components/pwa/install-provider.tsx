"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const InstallContext = createContext<InstallContextValue>({
  canInstall: false,
  isInstalled: false,
  promptInstall: async () => "unavailable",
});

export function useInstallPrompt() {
  return useContext(InstallContext);
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(standalone);

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
      value={{ canInstall: deferredEvent !== null, isInstalled, promptInstall }}
    >
      {children}
    </InstallContext.Provider>
  );
}
