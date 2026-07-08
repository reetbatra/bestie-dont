"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { startAnonymousSession } from "@/lib/actions/auth";

/**
 * Maps technical auth errors to copy she'd actually understand. Anything
 * unmapped falls back to a generic retry message — never surface a raw
 * Supabase error string to her.
 */
function friendlyAuthError(message: string): string {
  if (message.toLowerCase().includes("anonymous")) {
    return "We're not quite ready yet. Give us a minute and try again.";
  }
  return "That didn't go through. Try again?";
}

export default function WelcomePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await startAnonymousSession();
      if ("error" in result && result.error) {
        const friendly = friendlyAuthError(result.error);
        setError(friendly);
        toast.error(friendly);
        return;
      }
      router.push("/onboarding/date");
    });
  }

  return (
    <OnboardingScreen
      step={0}
      footer={
        <>
          <Button size="lg" className="w-full text-base" onClick={handleStart} disabled={isPending}>
            {isPending ? "One sec…" : "I'm in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No account needed. Not yet, at least.
          </p>
          {error && <p className="text-center text-xs text-destructive">{error}</p>}
        </>
      }
    >
      <div className="flex flex-1 flex-col justify-center">
        <p className="font-display text-2xl italic text-terracotta">Hey.</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-balance">
          You&apos;re not going to text him.
        </h1>
        <p className="mt-4 max-w-[38ch] text-lg text-muted-foreground">
          We&apos;re going to make sure of it.
        </p>
      </div>
    </OnboardingScreen>
  );
}
