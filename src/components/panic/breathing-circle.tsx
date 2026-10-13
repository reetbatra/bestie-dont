"use client";

import { useEffect, useState } from "react";

// 4s inhale, 4s hold, 8s exhale = 16s cycle
const PHASES = [
  { label: "breathe in", duration: 4000 },
  { label: "hold", duration: 4000 },
  { label: "breathe out", duration: 8000 },
] as const;

export function BreathingCircle({ onDone }: { onDone: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tick);
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    let index = 0;
    function next() {
      if (cancelled) return;
      setPhaseIndex(index % PHASES.length);
      const phase = PHASES[index % PHASES.length];
      index += 1;
      setTimeout(next, phase.duration);
    }
    next();
    return () => {
      cancelled = true;
    };
  }, []);

  const phase = PHASES[phaseIndex];
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="relative flex h-56 w-56 items-center justify-center">
        <div
          className="absolute inset-0 rounded-sketch-alt border-[1.5px] border-dashed border-ink bg-pink-soft motion-reduce:transition-none"
          style={{
            transform: phase.label === "breathe in" || phase.label === "hold" ? "scale(1)" : "scale(0.6)",
            transition: `transform ${phase.duration}ms ease-in-out`,
          }}
        />
        <div
          className="absolute h-32 w-32 rounded-sketch border-[1.5px] border-ink bg-paper motion-reduce:transition-none"
          style={{
            transform: phase.label === "breathe in" || phase.label === "hold" ? "scale(1)" : "scale(0.7)",
            transition: `transform ${phase.duration}ms ease-in-out`,
          }}
        />
        <span className="relative font-display text-2xl font-bold text-pink">{phase.label}</span>
      </div>

      <p className="mt-10 font-display text-4xl font-semibold tabular-nums">
        {mm}:{ss}
      </p>
    </div>
  );
}
