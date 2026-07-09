"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getResistCard, type ResistCard } from "@/lib/actions/panic";
import { CrisisLink } from "@/components/shared/crisis-link";

const TOTAL_SECONDS = 20 * 60;
const CACHE_KEY = "bestie:resist-card-cache";

function readCachedCard(): ResistCard | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ResistCard) : null;
  } catch {
    return null;
  }
}

function writeCachedCard(card: ResistCard) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(card));
  } catch {
    // storage unavailable (private mode) — the timer still works, it just
    // won't have a cached card to fall back on next time offline
  }
}

export function UrgeTimer() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [card, setCard] = useState<ResistCard | null>(null);
  const [isPending, startTransition] = useTransition();
  const navigated = useRef(false);

  // Hydrate instantly from whatever was last synced (works with zero
  // signal), then try for a fresh one in the background if we're online.
  useEffect(() => {
    setCard(readCachedCard());
    startTransition(async () => {
      try {
        const fresh = await getResistCard();
        setCard(fresh);
        writeCachedCard(fresh);
      } catch {
        // offline or the action failed — the cached card (if any) stands
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    try {
      sessionStorage.setItem("bestie:last-resist-card", JSON.stringify(card));
    } catch {
      // sessionStorage unavailable (private mode) — the done screen just
      // won't have the recap, no functional loss.
    }
    router.push("/panic/done");
  }, [card, router]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      finish();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, finish]);

  function rotateCard() {
    startTransition(async () => {
      try {
        const next = await getResistCard();
        setCard(next);
        writeCachedCard(next);
      } catch {
        // offline — keep showing the current card, nothing to rotate to
      }
    });
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-8 pt-10">
      <h1 className="font-display text-2xl font-semibold text-balance">This feeling has a timer.</h1>

      <div className="mt-10 flex flex-col items-center">
        <p className="font-display text-6xl font-semibold tabular-nums text-terracotta">
          {mm}:{ss}
        </p>
        <p className="mt-3 max-w-[34ch] text-center text-sm text-muted-foreground">
          Urges crest and fall in about 20 minutes. You&apos;re already on the other side of the
          peak.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {card?.recordFact && (
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              He said to you. The Record.
            </p>
            <p className="mt-2 text-base leading-snug text-foreground">{card.recordFact}</p>
          </div>
        )}
        {card?.identityLabel && (
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              You are also someone who
            </p>
            <p className="mt-2 text-base leading-snug text-foreground">{card.identityLabel}</p>
          </div>
        )}
        {card && !card.recordFact && !card.identityLabel && (
          <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
            Nothing in the Record yet. When you add something, it&apos;ll show up right here, at
            exactly the moment it&apos;s useful.
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pt-8">
        <button
          type="button"
          onClick={rotateCard}
          disabled={isPending}
          className="text-sm font-medium text-muted-foreground underline underline-offset-4"
        >
          Show me another
        </button>
        <Button variant="ghost" className="text-xs text-muted-foreground" onClick={finish}>
          Already past this? Continue →
        </Button>
        <CrisisLink className="mt-2 text-center" />
      </div>
    </div>
  );
}
