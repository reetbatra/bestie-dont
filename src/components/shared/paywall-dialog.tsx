"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { startCheckout } from "@/lib/actions/checkout";

export function PaywallDialog({
  open,
  onOpenChange,
  hasPurchased,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPurchased: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (hasPurchased) return null;

  function handleUnlock() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout();
      if (result.error || !result.checkoutUrl) {
        setError(result.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = result.checkoutUrl;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>The 60-Day Program</DialogTitle>
          <DialogDescription>
            One payment, ₹399 / $9.99. Here&apos;s exactly what it unlocks.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4 text-sm text-foreground">
          {[
            "Unlimited entries in your Record, not just three",
            "The full 8-week journaling arc, not just the first 3 days",
            "Vault drafts resurface after 30 days, so you can see how far you've come",
            "Milestone share cards",
          ].map((item) => (
            <li key={item} className="flex gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-muted-foreground">
          That&apos;s it. No subscription, no auto-renew, nothing to remember to cancel. We built
          it one-time on purpose: a good breakup app is one you outgrow. If day sixty comes and
          you never open this again, that was always the plan.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button size="lg" onClick={handleUnlock} disabled={isPending} className="w-full text-base">
            {isPending ? "One sec…" : "Get the full 60 days"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
