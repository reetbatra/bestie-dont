"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { startStreak } from "@/lib/actions/onboarding";
import { CalendarScene } from "@/components/doodles/scenes";

function toISODate(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function DatePage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const formatted = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
        date,
      ),
    [date],
  );

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await startStreak(toISODate(date));
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/onboarding/record");
    });
  }

  return (
    <OnboardingScreen
      step={1}
      footer={
        <>
          <Button size="lg" className="w-full text-base" onClick={handleContinue} disabled={isPending}>
            {isPending ? "Starting…" : "Start my streak →"}
          </Button>
          {error && <p className="text-center text-xs text-destructive">{error}</p>}
        </>
      }
    >
      <CalendarScene className="mx-auto max-h-44 w-full" />
      <h1 className="mt-4 font-display text-3xl font-bold text-balance">
        When did you last contact him?
      </h1>

      <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-6">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="cursor-pointer rounded-sketch border-[1.5px] border-ink bg-card px-8 py-5 text-center transition-colors hover:bg-pink-soft">
            <span className="block font-display text-4xl font-bold tabular-nums">
              {formatted}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">tap to change</span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={date}
              disabled={{ after: new Date() }}
              onSelect={(d) => {
                if (d) setDate(d);
                setOpen(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        <p className="max-w-[34ch] text-center text-sm text-muted-foreground">
          Your streak starts counting right now. Even if it was an hour ago.
        </p>
      </div>
    </OnboardingScreen>
  );
}
