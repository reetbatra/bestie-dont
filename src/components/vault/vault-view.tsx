"use client";

import { useState, useTransition } from "react";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createVaultEntry, resurfaceEntry, type DecryptedVaultEntry } from "@/lib/actions/vault";
import { VoiceInputButton } from "@/components/shared/voice-input-button";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );
}

function ResurfaceCard({ entry }: { entry: DecryptedVaultEntry }) {
  const [response, setResponse] = useState("");
  const [isPending, startTransition] = useTransition();
  const [answered, setAnswered] = useState(false);

  function submit() {
    startTransition(async () => {
      await resurfaceEntry(entry.id, response.trim());
      setAnswered(true);
    });
  }

  return (
    <div className="rounded-3xl border border-butter/60 bg-butter/10 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Written {formatDate(entry.createdAt)}
      </p>
      <p className="mt-2 text-sm leading-snug text-foreground">{entry.content}</p>
      {answered ? (
        <p className="mt-3 text-xs text-muted-foreground">Noted. Thanks for checking in on this.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-foreground">Still feel this way?</p>
          <Input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="A few words is enough"
          />
          <Button size="sm" variant="secondary" onClick={submit} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function VaultView({ initialEntries }: { initialEntries: DecryptedVaultEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const readyToResurface = entries.filter((e) => e.readyToResurface);
  const rest = entries.filter((e) => !e.readyToResurface);

  function handleLockIn() {
    if (!draft.trim()) return;
    startTransition(async () => {
      await createVaultEntry(draft.trim());
      setEntries((prev) => [
        {
          id: crypto.randomUUID(),
          content: draft.trim(),
          createdAt: new Date().toISOString(),
          resurfacedAt: null,
          stillFeel: null,
          readyToResurface: false,
        },
        ...prev,
      ]);
      setDraft("");
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-16">
      <ScreenHeader title="The Vault" subtitle="Say everything. Send nothing." />

      <div className="px-6">
        <div className="relative">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="I keep thinking about what you said on Saturday..."
            className="min-h-32 resize-none pr-12"
          />
          <VoiceInputButton
            className="absolute bottom-2.5 right-2.5"
            onTranscript={(chunk) =>
              setDraft((prev) => (prev && !prev.endsWith(" ") ? `${prev} ${chunk}` : prev + chunk))
            }
          />
        </div>
        <Button
          onClick={handleLockIn}
          disabled={isPending || !draft.trim()}
          className="mt-3 w-full"
        >
          {isPending ? "Locking in…" : "Lock it in"}
        </Button>
      </div>

      {readyToResurface.length > 0 && (
        <div className="mt-8 flex flex-col gap-3 px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resurfaced
          </p>
          {readyToResurface.map((entry) => (
            <ResurfaceCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 px-6">
        {rest.length === 0 && readyToResurface.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing here yet. Write the thing you&apos;d never send.
            </p>
          </div>
        )}
        {rest.map((entry) => (
          <div key={entry.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {formatDate(entry.createdAt)}
            </p>
            <p className="mt-2 text-sm leading-snug text-foreground">{entry.content}</p>
            {entry.stillFeel && (
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                30 days later: {entry.stillFeel}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
