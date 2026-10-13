"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogSlipDialog } from "@/components/panic/log-slip-dialog";
import type { ResistCard } from "@/lib/actions/panic";
import { RestScene } from "@/components/doodles/scenes";

export default function PanicDonePage() {
  const [card, setCard] = useState<ResistCard | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("bestie:last-resist-card");
      if (raw) setCard(JSON.parse(raw));
    } catch {
      // no recap available, screen still works without it
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-8 pt-10">
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
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <LogSlipDialog
            trigger={<span className="cursor-pointer underline underline-offset-4">That didn&apos;t work</span>}
          />
          <span>·</span>
          <Link href="/record?new=1" className="underline underline-offset-4">
            Add a memory
          </Link>
        </div>
      </div>
    </div>
  );
}
