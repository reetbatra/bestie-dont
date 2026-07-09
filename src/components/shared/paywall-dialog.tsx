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
            The price of one sad delivery order, for sixty days of not texting him.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 text-sm text-foreground">
          <li>Unlimited entries in your Record, not just three</li>
          <li>The full 8-week journaling arc</li>
          <li>Vault draft resurfacing after 30 days</li>
          <li>Milestone share cards</li>
          <li>One payment. No subscription, ever.</li>
        </ul>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={handleUnlock} disabled={isPending} className="w-full">
            {isPending ? "One sec…" : "Unlock the full 60 days"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
