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
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-8 pt-10">
      <div className="mb-10 flex items-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < step ? "bg-terracotta" : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      <div className="mt-8 flex flex-col gap-3">{footer}</div>
    </div>
  );
}
