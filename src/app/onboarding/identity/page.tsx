"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addIdentityItems, type IdentityItemInput } from "@/lib/actions/onboarding";
import { KeepsakesScene } from "@/components/doodles/scenes";

const SUGGESTIONS: IdentityItemInput[] = [
  { label: "Running", category: "hobby" },
  { label: "Reading", category: "hobby" },
  { label: "Pilates & lifting", category: "hobby" },
  { label: "Pottery", category: "hobby" },
  { label: "Cooking", category: "hobby" },
  { label: "Morning walks", category: "hobby" },
  { label: "My career", category: "goal" },
  { label: "Solo travel", category: "goal" },
  { label: "Grad school", category: "goal" },
  { label: "My best friend", category: "friend" },
  { label: "My sister", category: "friend" },
  { label: "The group chat", category: "friend" },
  { label: "My parents", category: "friend" },
  { label: "Writing", category: "trait" },
  { label: "Being the funny one", category: "trait" },
];

function pickedHint(count: number): string {
  if (count === 0) return "Pick three. More is fine too.";
  if (count < 3) return `${count} picked. ${3 - count} more to go.`;
  return `${count} picked. Good.`;
}

export default function IdentityPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<IdentityItemInput[]>([]);
  const [customValue, setCustomValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(item: IdentityItemInput) {
    setSelected((prev) =>
      prev.some((i) => i.label === item.label)
        ? prev.filter((i) => i.label !== item.label)
        : [...prev, item],
    );
  }

  function addCustom() {
    const label = customValue.trim();
    if (!label) return;
    if (selected.some((i) => i.label.toLowerCase() === label.toLowerCase())) {
      setCustomValue("");
      return;
    }
    setSelected((prev) => [...prev, { label, category: "trait" }]);
    setCustomValue("");
  }

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await addIdentityItems(selected);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/onboarding/deal");
    });
  }

  return (
    <OnboardingScreen
      step={3}
      footer={
        <>
          <Button size="lg" className="w-full text-base" onClick={handleContinue} disabled={isPending}>
            {isPending ? "Saving…" : "These are mine →"}
          </Button>
        </>
      }
    >
      <KeepsakesScene className="mx-auto max-h-40 w-full" />
      <h1 className="mt-4 font-display text-3xl font-extrabold text-balance">
        Three things that are yours.
      </h1>
      <p className="mt-1 text-lg font-bold text-apricot-deep">
        Not the relationship&apos;s.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SUGGESTIONS.map((item) => {
          const isSelected = selected.some((i) => i.label === item.label);
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => toggle(item)}
              aria-pressed={isSelected}
              className={cn(
                "min-h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors",
                isSelected
                  ? "border-transparent bg-sun text-primary-foreground shadow-soft"
                  : "border-border bg-card text-foreground hover:bg-peach/60",
              )}
            >
              {item.label}
            </button>
          );
        })}
        {selected
          .filter((i) => !SUGGESTIONS.some((s) => s.label === i.label))
          .map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => toggle(item)}
              aria-pressed
              className="min-h-11 cursor-pointer rounded-full border border-transparent bg-sun px-4 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              {item.label}
            </button>
          ))}
      </div>

      <div className="mt-6 flex gap-2">
        <Input
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add your own"
        />
        <Button variant="secondary" onClick={addCustom} type="button" className="h-12 px-5" disabled={!customValue.trim()}>
          Add
        </Button>
      </div>

      <p className="mt-4 px-1 text-sm text-muted-foreground" aria-live="polite">
        {pickedHint(selected.length)}
      </p>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </OnboardingScreen>
  );
}
