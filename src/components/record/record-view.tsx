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
import { createRecordEntry, type RecordEntry } from "@/lib/actions/record";
import { PaywallDialog } from "@/components/shared/paywall-dialog";
import { VoiceInputButton } from "@/components/shared/voice-input-button";

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
}: {
  initialEntries: RecordEntry[];
  atFreeLimit: boolean;
  hasPurchased: boolean;
  inTrial: boolean;
}) {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState(initialEntries);
  const [tab, setTab] = useState<"all" | "raw" | "settled">("all");
  const [dialogOpen, setDialogOpen] = useState(
    searchParams.get("new") === "1" && !initialAtFreeLimit,
  );
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [fact, setFact] = useState("");
  const [feeling, setFeeling] = useState("");
  const [selfFacing, setSelfFacing] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayISO());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasFullAccess = hasPurchased || inTrial;
  const atFreeLimit = !hasFullAccess && entries.length >= FREE_TIER_LIMIT;

  const filtered = useMemo(() => {
    if (tab === "raw") return entries.filter((r) => r.isRaw);
    if (tab === "settled") return entries.filter((r) => !r.isRaw);
    return entries;
  }, [entries, tab]);

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
      setEntries((prev) => [
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
      ]);
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
        <div className="mx-6 mb-4 rounded-2xl bg-forest/10 px-4 py-2.5 text-center text-xs font-medium text-forest">
          Free trial week. Unlimited, no card needed.
        </div>
      )}

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
        {filtered.map((entry) => (
          <div key={entry.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {formatDate(entry.occurredOn)}
              </p>
              {entry.isRaw && (
                <Badge variant="outline" className="border-terracotta/40 text-terracotta">
                  raw
                </Badge>
              )}
            </div>
            <p className="mt-2 text-base leading-snug text-foreground">{entry.fact}</p>
            {entry.feeling && (
              <p className="mt-2 text-sm text-muted-foreground">{entry.feeling}</p>
            )}
            {entry.selfFacing && (
              <div className="mt-3 rounded-2xl bg-butter/15 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            className="rounded-3xl border border-dashed border-terracotta/40 bg-terracotta/5 p-5 text-center text-sm font-medium text-terracotta"
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
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="fact">What happened</Label>
              <div className="relative mt-1.5">
                <Textarea
                  id="fact"
                  value={fact}
                  onChange={(e) => setFact(e.target.value)}
                  className="min-h-24 resize-none pr-12"
                  placeholder="Fact, not the story you're telling yourself about it."
                />
                <VoiceInputButton
                  className="absolute bottom-2.5 right-2.5"
                  onTranscript={(chunk) =>
                    setFact((prev) => (prev && !prev.endsWith(" ") ? `${prev} ${chunk}` : prev + chunk))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="feeling">How it felt (optional)</Label>
              <div className="relative mt-1.5">
                <Textarea
                  id="feeling"
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  className="min-h-16 resize-none pr-12"
                />
                <VoiceInputButton
                  className="absolute bottom-2.5 right-2.5"
                  onTranscript={(chunk) =>
                    setFeeling((prev) => (prev && !prev.endsWith(" ") ? `${prev} ${chunk}` : prev + chunk))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="self-facing">What you told yourself (optional)</Label>
              <div className="relative mt-1.5">
                <Textarea
                  id="self-facing"
                  value={selfFacing}
                  onChange={(e) => setSelfFacing(e.target.value)}
                  className="min-h-16 resize-none pr-12"
                  placeholder="He was just busy. He wasn't."
                />
                <VoiceInputButton
                  className="absolute bottom-2.5 right-2.5"
                  onTranscript={(chunk) =>
                    setSelfFacing((prev) =>
                      prev && !prev.endsWith(" ") ? `${prev} ${chunk}` : prev + chunk,
                    )
                  }
                />
              </div>
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
    </div>
  );
}
