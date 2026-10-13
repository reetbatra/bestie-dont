"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogSlipDialog } from "@/components/panic/log-slip-dialog";
import type { ResistCard } from "@/lib/actions/panic";
import { useStoredJson } from "@/hooks/use-stored-json";
import { RestScene } from "@/components/doodles/scenes";

export default function PanicDonePage() {
  // Written by the urge timer on its way here. Missing in private mode or on
  // a direct visit, and the screen works fine without the recap.
  const card = useStoredJson<ResistCard>("session", "bestie:last-resist-card");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <RestScene className="mx-auto mb-4 w-full max-w-72" />
      <h1 className="font-display text-4xl font-extrabold text-balance">You made it.</h1>
      <p className="mt-2 text-base text-muted-foreground">
        Twenty minutes. Done. It&apos;s gone.
      </p>

      {(card?.recordFact || card?.identityLabel) && (
        <div className="mt-8 flex flex-col gap-3">
          {card.recordFact && (
            <div className="rounded-3xl border border-border bg-card shadow-soft p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                He said to you. The Record.
              </p>
              <p className="mt-2 text-sm leading-snug text-foreground">{card.recordFact}</p>
            </div>
          )}
          {card.identityLabel && (
            <div className="rounded-3xl border border-border bg-card shadow-soft p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                You are also someone who
              </p>
              <p className="mt-2 text-sm leading-snug text-foreground">{card.identityLabel}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <Button
          render={<Link href="/home" />}
          size="lg"
          className="w-full"
        >
          I made it through.
        </Button>
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <LogSlipDialog
            triggerClassName="min-h-11 cursor-pointer px-1"
            trigger={<span className="underline underline-offset-4">That didn&apos;t work</span>}
          />
          <span aria-hidden="true">·</span>
          <Link href="/record?new=1" className="inline-flex min-h-11 items-center px-1 underline underline-offset-4">
            Add a memory
          </Link>
        </div>
      </div>
    </div>
  );
}
