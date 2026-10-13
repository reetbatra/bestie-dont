"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addIdentityItems, type IdentityItemInput } from "@/lib/actions/onboarding";
import { MineBoxScene } from "@/components/doodles/scenes";

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
      <MineBoxScene className="mx-auto max-h-40 w-full" />
      <h1 className="mt-4 font-display text-3xl font-bold text-balance">
        Three things that are yours.
      </h1>
      <p className="mt-1 font-display text-xl font-bold text-pink">
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
              className={cn(
                "cursor-pointer rounded-sketch-sm border-[1.5px] border-ink px-4 py-2 text-sm font-semibold transition-colors",
                isSelected
                  ? "bg-pink text-primary-foreground"
                  : "bg-card text-foreground hover:bg-pink-soft",
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
              className="cursor-pointer rounded-sketch-sm border-[1.5px] border-ink bg-pink px-4 py-2 text-sm font-semibold text-primary-foreground"
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
        <Button variant="secondary" onClick={addCustom} type="button">
          Add
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{selected.length} selected</p>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </OnboardingScreen>
  );
}
