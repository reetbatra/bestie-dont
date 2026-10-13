"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/components/pwa/install-provider";
import { Smartphone, Share, MoreVertical } from "lucide-react";
import { CalmButtonScene } from "@/components/doodles/scenes";

export default function TheDealPage() {
  const router = useRouter();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [installed, setInstalled] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleInstall() {
    if (!canInstall) {
      toast("Look for “Install app” or “Add to Home screen” in your browser's menu (usually the ⋮ in the top corner).");
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") setInstalled(true);
  }

  function handleFinish() {
    startTransition(() => {
      router.push("/home");
    });
  }

  return (
    <OnboardingScreen
      step={4}
      footer={
        <>
          <Button size="lg" className="w-full text-base" onClick={handleFinish} disabled={isPending}>
            {isPending ? "One sec…" : "Take me home →"}
          </Button>
        </>
      }
    >
      <CalmButtonScene className="mx-auto max-h-40 w-full" />
      <h1 className="mt-4 font-display text-3xl font-extrabold text-balance">
        When you want to text him.
      </h1>
      <p className="mt-1 text-lg font-bold text-apricot-deep">Come here first.</p>

      <div className="mt-6 rounded-3xl border border-border bg-card shadow-soft p-6">
        <p className="text-sm font-semibold text-muted-foreground">
          Your panic button
        </p>
        <div className="mt-3 w-full rounded-full bg-sun shadow-soft px-6 py-4 text-center font-display text-lg font-extrabold text-primary-foreground">
          don&apos;t text him. come here.
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          One tap. We&apos;ll get you through 20 minutes. It works even with no signal, because
          it&apos;s the one screen that has to.
        </p>
      </div>

      {!isInstalled && !installed && isIOS && (
        <div className="mt-4 rounded-3xl border border-border bg-card shadow-soft p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-butter/40 text-ink">
              <Share className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Put your bestie one tap away</p>
              <p className="text-xs text-muted-foreground">
                Tap the Share icon below, then &quot;Add to Home Screen&quot;
              </p>
            </div>
          </div>
        </div>
      )}

      {!isInstalled && !installed && !isIOS && (
        <div className="mt-4 flex items-center gap-4 rounded-3xl border border-border bg-card shadow-soft p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-butter/40 text-ink">
            {canInstall ? (
              <Smartphone className="h-5 w-5" />
            ) : (
              <MoreVertical className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Put your bestie one tap away</p>
            <p className="text-xs text-muted-foreground">
              {canInstall ? "Add to your homescreen" : "Check your browser menu to install"}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={handleInstall}>
            Add
          </Button>
        </div>
      )}

      <div className="mt-4 rounded-3xl border border-border bg-card shadow-soft p-5">
        <p className="text-sm font-semibold">Zero notifications. On purpose.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          We don&apos;t ping, buzz, or check in on you. Come back when you want to, not when we
          tell you to.
        </p>
      </div>
    </OnboardingScreen>
  );
}
