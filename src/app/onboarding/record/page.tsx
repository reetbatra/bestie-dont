"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addFirstRecordEntry } from "@/lib/actions/onboarding";
import { NoteScene } from "@/components/doodles/scenes";

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export default function FirstRecordPage() {
  const router = useRouter();
  const [fact, setFact] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!fact.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addFirstRecordEntry(fact.trim(), todayISO());
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/onboarding/identity");
    });
  }

  function handleSkip() {
    router.push("/onboarding/identity");
  }

  return (
    <OnboardingScreen
      step={2}
      footer={
        <>
          <Button
            size="lg"
            className="w-full text-base"
            onClick={handleSave}
            disabled={isPending || !fact.trim()}
          >
            {isPending ? "Saving…" : "Save it"}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleSkip}>
            Skip for now
          </Button>
          {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
        </>
      }
    >
      <NoteScene className="mx-auto max-h-40 w-full" />
      <h1 className="mt-4 font-display text-3xl font-extrabold text-balance">
        Before your brain starts editing history.
      </h1>
      <p className="mt-3 max-w-[38ch] text-base leading-relaxed text-muted-foreground">
        What&apos;s one thing he did that you don&apos;t want to forget?{" "}
        <span className="font-bold text-apricot-deep">Not the relationship&apos;s.</span>
      </p>

      <div className="mt-6">
        <Textarea
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          placeholder="He said he'd call by the time he landed. Didn't, and told everyone he 'forgot' to."
          className="min-h-36 resize-none"
          autoFocus
        />
        <p className="mt-2.5 px-1 text-sm text-muted-foreground">Future you at 1am needs this.</p>
      </div>
    </OnboardingScreen>
  );
}
