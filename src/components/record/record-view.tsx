"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRecordEntry, type RecordEntry } from "@/lib/actions/record";
import { PaywallDialog } from "@/components/shared/paywall-dialog";
import { SaveAccessForm } from "@/components/shared/save-access-form";
import { EncryptedNote } from "@/components/shared/encrypted-note";

const FREE_TIER_LIMIT = 3;

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${iso}T00:00:00`),
  );
}

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function RecordView({
  initialEntries,
  atFreeLimit: initialAtFreeLimit,
  hasPurchased,
  inTrial,
  hasEmail,
}: {
  initialEntries: RecordEntry[];
  atFreeLimit: boolean;
  hasPurchased: boolean;
  inTrial: boolean;
  hasEmail: boolean;
}) {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState(initialEntries);
  const [dialogOpen, setDialogOpen] = useState(
    searchParams.get("new") === "1" && !initialAtFreeLimit,
  );
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [saveAccessOpen, setSaveAccessOpen] = useState(false);
  const [fact, setFact] = useState("");
  const [feeling, setFeeling] = useState("");
  const [selfFacing, setSelfFacing] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayISO());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasFullAccess = hasPurchased || inTrial;
  const atFreeLimit = !hasFullAccess && entries.length >= FREE_TIER_LIMIT;

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
      const result = await createRecordEntry({
        fact: fact.trim(),
        feeling: feeling.trim(),
        selfFacing: selfFacing.trim(),
        occurredOn,
      });
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
      setSelfFacing("");
      setEntries((prev) => {
        const next = [
          {
            id: crypto.randomUUID(),
            fact: fact.trim(),
            feeling: feeling.trim() || null,
            selfFacing: selfFacing.trim() || null,
            occurredOn,
            isRaw: true,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ];
        // Deferred signup: the first moment she has data worth losing.
        if (next.length === 2 && !hasEmail) setSaveAccessOpen(true);
        return next;
      });
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-24">
      <ScreenHeader
        title="The Record"
        subtitle="The honest version. Not the highlight reel."
        action={
          <Button size="sm" onClick={openCreate}>
            + New
          </Button>
        }
      />

      {inTrial && !hasPurchased && (
        <div className="mx-6 mb-4 rounded-2xl bg-sage/10 px-4 py-2.5 text-center text-xs font-medium text-sage">
          Free trial week. Unlimited, no card needed.
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 px-6">
        {entries.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Your memory is still doing PR for him. Fix that.
            </p>
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-3xl border border-border bg-card shadow-soft p-5">
            <p className="text-xs font-medium text-muted-foreground">
              {formatDate(entry.occurredOn)}
            </p>
            <p className="mt-2 text-base leading-snug text-foreground">{entry.fact}</p>
            {entry.feeling && (
              <p className="mt-2 text-sm text-muted-foreground">{entry.feeling}</p>
            )}
            {entry.selfFacing && (
              <div className="mt-3 rounded-2xl bg-butter/15 p-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  What you told yourself
                </p>
                <p className="mt-1 text-sm text-foreground">{entry.selfFacing}</p>
              </div>
            )}
          </div>
        ))}

        {atFreeLimit && (
          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="rounded-3xl border border-dashed border-apricot/40 bg-peach/40 p-5 text-center text-sm font-medium text-apricot-deep"
          >
            Unlock the full Record →
          </button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to the record</DialogTitle>
          </DialogHeader>
          <EncryptedNote />
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
              <Label htmlFor="self-facing">What you told yourself (optional)</Label>
              <Textarea
                id="self-facing"
                value={selfFacing}
                onChange={(e) => setSelfFacing(e.target.value)}
                className="mt-1.5 min-h-16 resize-none"
                placeholder="He was just busy. He wasn't."
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                The excuse you made for him. This is the part that transfers to the next one.
              </p>
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

      <Dialog open={saveAccessOpen} onOpenChange={setSaveAccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Want to make sure you never lose these?</DialogTitle>
            <DialogDescription>
              Right now this is saved to this browser only. Add an email and it&apos;s yours
              wherever you log back in from. Skippable, no pressure.
            </DialogDescription>
          </DialogHeader>
          <SaveAccessForm onDone={() => setSaveAccessOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
