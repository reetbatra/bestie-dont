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
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle,var(--peach)_0%,rgb(253_230_208/0.35)_70%)] motion-reduce:transition-none"
          style={{
            transform: phase.label === "breathe in" || phase.label === "hold" ? "scale(1)" : "scale(0.6)",
            transition: `transform ${phase.duration}ms ease-in-out`,
          }}
        />
        <div
          className="absolute h-32 w-32 rounded-full bg-sun opacity-85 shadow-soft motion-reduce:transition-none"
          style={{
            transform: phase.label === "breathe in" || phase.label === "hold" ? "scale(1)" : "scale(0.7)",
            transition: `transform ${phase.duration}ms ease-in-out`,
          }}
        />
        <span className="relative font-display text-lg font-bold text-ink">{phase.label}</span>
      </div>

      <p className="mt-10 font-display text-4xl font-extrabold tabular-nums">
        {mm}:{ss}
      </p>
    </div>
  );
}
