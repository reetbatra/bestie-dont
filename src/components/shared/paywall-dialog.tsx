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
        <ul className="flex flex-col gap-2 text-sm text-foreground">
          <li>Unlimited entries in your Record, not just three</li>
          <li>The full 8-week journaling arc, not just the first 3 days</li>
          <li>Vault drafts resurface after 30 days, so you can see how far you&apos;ve come</li>
          <li>Milestone share cards</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          That&apos;s it. No subscription, no auto-renew, nothing to remember to cancel. We built
          it one-time on purpose: a good breakup app is one you outgrow. If day sixty comes and
          you never open this again, that was always the plan.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={handleUnlock} disabled={isPending} className="w-full">
            {isPending ? "One sec…" : "Get the full 60 days"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
