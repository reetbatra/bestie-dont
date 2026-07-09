"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PaywallDialog } from "@/components/shared/paywall-dialog";
import {
  saveJournalEntry,
  skipJournalEntry,
  type TodayJournal,
  type JournalHistoryItem,
} from "@/lib/actions/journal";
import { JOURNAL_FREE_DAYS } from "@/lib/streak";

export function JournalView({
  today,
  history,
}: {
  today: TodayJournal;
  history: JournalHistoryItem[];
}) {
  const router = useRouter();
  const [response, setResponse] = useState(today.existingResponse ?? "");
  const [isPending, startTransition] = useTransition();
  const [paywallOpen, setPaywallOpen] = useState(today.locked);
  const [saved, setSaved] = useState(Boolean(today.existingResponse));

  function handleSave() {
    if (!response.trim() || !today.promptId) return;
    startTransition(async () => {
      await saveJournalEntry(today.dayIndex, today.promptId!, response.trim());
      setSaved(true);
      router.refresh();
    });
  }

  function handleSkip() {
    if (!today.promptId) return;
    startTransition(async () => {
      await skipJournalEntry(today.dayIndex, today.promptId!);
      router.push("/home");
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-16">
      <ScreenHeader
        title="Daily Journal"
        subtitle={`Week ${today.weekNumber} · ${today.arcLabel}`}
      />

      {today.inTrial && (
        <div className="mx-6 mb-4 rounded-2xl bg-forest/10 px-4 py-2.5 text-center text-xs font-medium text-forest">
          Free trial week. Unlimited, no card needed.
        </div>
      )}

      <div className="px-6">
        {today.locked ? (
          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="w-full rounded-3xl border border-dashed border-terracotta/40 bg-terracotta/5 p-8 text-center"
          >
            <p className="text-sm font-medium text-terracotta">
              Day {today.dayIndex} is part of the full 8-week arc.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              The first {JOURNAL_FREE_DAYS} days are free. Unlock the rest →
            </p>
          </button>
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Day {today.dayIndex}
              </p>
              <p className="mt-2 text-lg leading-snug text-foreground">{today.promptText}</p>
            </div>

            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write whatever comes. No one's grading this."
              className="mt-4 min-h-40 resize-none"
            />

            {saved && !isPending && (
              <p className="mt-2 text-xs text-muted-foreground">Saved.</p>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <Button onClick={handleSave} disabled={isPending || !response.trim()}>
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button variant="ghost" className="text-muted-foreground" onClick={handleSkip}>
                Skip today
              </Button>
            </div>
          </>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-10 flex flex-col gap-3 px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Past days
          </p>
          {history.map((item) => (
            <div key={item.dayIndex} className="rounded-3xl border border-border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">Day {item.dayIndex}</p>
              <p className="mt-1 text-sm text-foreground">{item.promptText}</p>
              {item.skipped ? (
                <p className="mt-2 text-xs italic text-muted-foreground">Skipped</p>
              ) : (
                item.response && (
                  <p className="mt-2 text-sm text-muted-foreground">{item.response}</p>
                )
              )}
            </div>
          ))}
        </div>
      )}

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        hasPurchased={today.hasPurchased}
      />
    </div>
  );
}
