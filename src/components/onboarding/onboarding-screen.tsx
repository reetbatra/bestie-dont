import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 5;

export function OnboardingScreen({
  step,
  children,
  footer,
}: {
  step: number;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="mb-8 flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`} role="img">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-500",
              i <= step ? "bg-sun" : "bg-input/70",
            )}
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      <div className="mt-8 flex flex-col gap-2">{footer}</div>
    </div>
  );
}
