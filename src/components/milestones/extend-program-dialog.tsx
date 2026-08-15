"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DETOX_RULES } from "@/lib/streak";
import { extendProgram } from "@/lib/actions/milestones";

/**
 * Offered once, at the day-60 milestone: 30 more days on the same streak,
 * under stricter rules. The rules themselves are display-only - there's
 * nothing here to check off, just a day count and a commitment.
 */
export function ExtendProgramDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await extendProgram();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/home");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full">
        <Button variant="outline" size="lg" className="w-full">
          Extend 30 more days
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thirty more days. Stricter rules.</DialogTitle>
          <DialogDescription>
            Same streak, no reset. Just thirty more days, and this time the bar is higher.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 text-sm text-foreground">
          {DETOX_RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span className="text-terracotta">•</span>
              {rule}
            </li>
          ))}
        </ul>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleConfirm} disabled={isPending} className="w-full">
            {isPending ? "Extending…" : "I'm in - extend 30 days"}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="w-full">
            Not yet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
