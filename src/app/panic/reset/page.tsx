"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { BreathingCircle } from "@/components/panic/breathing-circle";
import { Button } from "@/components/ui/button";
import { CrisisLink } from "@/components/shared/crisis-link";

export default function SomaticResetPage() {
  const router = useRouter();
  const navigated = useRef(false);

  const goToTimer = useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    router.push("/panic/timer");
  }, [router]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-8 pt-10">
      <div>
        <p className="font-display text-2xl font-semibold italic text-terracotta">Good.</p>
        <p className="mt-1 max-w-[36ch] text-base text-muted-foreground">
          You came here instead. Let&apos;s get your body first. The thinking can wait.
        </p>
      </div>

      <BreathingCircle onDone={goToTimer} />

      <Button variant="ghost" className="w-full text-muted-foreground" onClick={goToTimer}>
        Skip breathing →
      </Button>
      <CrisisLink className="mt-4 text-center" />
    </div>
  );
}
