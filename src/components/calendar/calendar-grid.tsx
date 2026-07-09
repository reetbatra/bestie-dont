import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarGrid({
  currentDay,
  totalDays,
  daysLeft,
  slipDays,
  milestoneDays,
  graduated,
}: {
  currentDay: number;
  totalDays: number;
  daysLeft: number;
  slipDays: Set<number>;
  milestoneDays: readonly number[];
  graduated: boolean;
}) {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-10">
      <Link
        href="/home"
        className="mb-3 inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Home
      </Link>

      <h1 className="font-display text-2xl font-semibold text-balance">The 60 days.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {graduated
          ? "You made it through all sixty. This page is a record of that, not a countdown anymore."
          : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left. Not a folk rule, sixty days is where the research on no-contact recovery actually lands.`}
      </p>

      <div className="mt-6 grid grid-cols-10 gap-1.5">
        {days.map((d) => {
          const isPast = d < currentDay;
          const isToday = d === currentDay && !graduated;
          const isSlipped = slipDays.has(d);
          const isMilestone = milestoneDays.includes(d as (typeof milestoneDays)[number]);
          const filled = isPast || isToday || graduated;

          return (
            <div
              key={d}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-medium tabular-nums",
                filled ? "bg-terracotta text-primary-foreground" : "bg-muted text-muted-foreground",
                isToday && "ring-2 ring-terracotta ring-offset-2 ring-offset-background",
                isSlipped && "bg-butter text-[#23201C]",
                isMilestone && !filled && "border border-dashed border-terracotta/50",
              )}
              title={
                isSlipped
                  ? `Day ${d} — logged, streak continued`
                  : isMilestone
                    ? `Day ${d} — milestone`
                    : `Day ${d}`
              }
            >
              {d}
              {isSlipped && (
                <span className="absolute -right-0.5 -top-0.5 text-[8px] text-[#23201C]">*</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-terracotta" /> Done
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-butter" /> Logged a slip, kept going
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-terracotta/50 bg-transparent" />{" "}
          Milestone
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted" /> Ahead
        </span>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Why sixty, specifically
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          The &quot;30 day rule&quot; you&apos;ve probably heard of isn&apos;t actually backed by
          research. Studies on no-contact recovery point to something closer to 60 to 90 days for
          real emotional improvement, and contact in the first 28 days specifically slows that
          decline in feelings down. Sixty days also lines up with the upper end of habit-formation
          research (21 to 66 days). That&apos;s the number this program is built around, not a
          nice round one.
        </p>
        <Link
          href="/why"
          className="mt-3 inline-block text-xs font-medium text-terracotta underline underline-offset-4"
        >
          See all the research →
        </Link>
      </div>
    </div>
  );
}
