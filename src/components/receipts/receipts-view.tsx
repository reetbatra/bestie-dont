"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createReceipt, type DecryptedReceipt } from "@/lib/actions/receipts";
import { PaywallDialog } from "@/components/shared/paywall-dialog";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${iso}T00:00:00`),
  );
}

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const FREE_TIER_LIMIT = 3;

export function ReceiptsView({
  initialReceipts,
  atFreeLimit: initialAtFreeLimit,
  hasPurchased,
}: {
  initialReceipts: DecryptedReceipt[];
  atFreeLimit: boolean;
  hasPurchased: boolean;
}) {
  const searchParams = useSearchParams();
  const [receipts, setReceipts] = useState(initialReceipts);
  const [tab, setTab] = useState<"all" | "raw" | "settled">("all");
  const [dialogOpen, setDialogOpen] = useState(
    searchParams.get("new") === "1" && !initialAtFreeLimit,
  );
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [fact, setFact] = useState("");
  const [feeling, setFeeling] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayISO());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Derived from live local state instead of the initial server prop, so
  // crossing the free-tier limit updates the paywall banner the instant the
  // optimistic insert lands — no round-trip refetch required.
  const atFreeLimit = !hasPurchased && receipts.length >= FREE_TIER_LIMIT;

  const filtered = useMemo(() => {
    if (tab === "raw") return receipts.filter((r) => r.isRaw);
    if (tab === "settled") return receipts.filter((r) => !r.isRaw);
    return receipts;
  }, [receipts, tab]);

  function openCreate() {
    if (atFreeLimit) {
      setPaywallOpen(true);
      return;
    }
    setDialogOpen(true);
  }

  function handleSave() {
    if (!fact.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createReceipt({ fact: fact.trim(), feeling: feeling.trim(), occurredOn });
      if (result.error === "paywall") {
        setDialogOpen(false);
        setPaywallOpen(true);
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      setDialogOpen(false);
      setFact("");
      setFeeling("");
      setReceipts((prev) => [
        {
          id: crypto.randomUUID(),
          fact: fact.trim(),
          feeling: feeling.trim() || null,
          selfFacing: null,
          occurredOn,
          isRaw: true,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-24">
      <ScreenHeader
        title="The Receipts"
        subtitle="The honest record. Memory this PR."
        action={
          <Button size="sm" onClick={openCreate}>
            + New
          </Button>
        }
      />

      <div className="px-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex-1">
              Raw
            </TabsTrigger>
            <TabsTrigger value="settled" className="flex-1">
              Settled
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 flex flex-col gap-3 px-6">
        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Your memory is still doing PR for him. Fix that.
            </p>
          </div>
        )}
        {filtered.map((receipt) => (
          <div key={receipt.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {formatDate(receipt.occurredOn)}
              </p>
              {receipt.isRaw && (
                <Badge variant="outline" className="border-terracotta/40 text-terracotta">
                  raw
                </Badge>
              )}
            </div>
            <p className="mt-2 text-base leading-snug text-foreground">{receipt.fact}</p>
            {receipt.feeling && (
              <p className="mt-2 text-sm text-muted-foreground">{receipt.feeling}</p>
            )}
          </div>
        ))}

        {atFreeLimit && (
          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="rounded-3xl border border-dashed border-terracotta/40 bg-terracotta/5 p-5 text-center text-sm font-medium text-terracotta"
          >
            Unlock unlimited Receipts →
          </button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Receipt</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="fact">What happened</Label>
              <Textarea
                id="fact"
                value={fact}
                onChange={(e) => setFact(e.target.value)}
                className="mt-1.5 min-h-24 resize-none"
                placeholder="Fact, not the story you're telling yourself about it."
              />
            </div>
            <div>
              <Label htmlFor="feeling">How it felt (optional)</Label>
              <Textarea
                id="feeling"
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                className="mt-1.5 min-h-16 resize-none"
              />
            </div>
            <div>
              <Label htmlFor="occurred">Date</Label>
              <Input
                id="occurred"
                type="date"
                value={occurredOn}
                max={todayISO()}
                onChange={(e) => setOccurredOn(e.target.value)}
                className="mt-1.5"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isPending || !fact.trim()} className="w-full">
              {isPending ? "Saving…" : "Save it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} hasPurchased={hasPurchased} />
    </div>
  );
}
