"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { LogSlipDialog } from "@/components/panic/log-slip-dialog";

/** The calendar date a streak day falls on, in the viewer's timezone. */
function dayToDate(startDate: string, day: number): string {
  const start = new Date(`${startDate}T00:00:00`);
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (day - 1));
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function dayLabel(startDate: string, day: number): string {
  const [y, m, d] = dayToDate(startDate, day).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

export interface SlipDetail {
  id: string;
  note: string | null;
}

export function CalendarGrid({
  currentDay,
  totalDays,
  daysLeft,
  startDate,
  slipDetails,
  slipInsight,
  milestoneDays,
  graduated,
}: {
  currentDay: number;
  totalDays: number;
  daysLeft: number;
  startDate: string;
  slipDetails: [number, SlipDetail][];
  slipInsight: string | null;
  milestoneDays: readonly number[];
  graduated: boolean;
}) {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const slipMap = new Map(slipDetails);
  const slipped = new Set(slipMap.keys());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const sel = selectedDay;
  const selIsSlipped = sel !== null && slipped.has(sel);
  const selIsReached = sel !== null && (graduated || sel <= currentDay);
  const selSlip = sel !== null ? slipMap.get(sel) : undefined;
  const currentDaySlip = slipMap.get(currentDay);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-[max(1.75rem,env(safe-area-inset-top))]">
      <Link
        href="/home"
        className="-ml-2 mb-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-full pl-1 pr-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Home
      </Link>

      <h1 className="font-display text-2xl font-extrabold text-balance">The 60 days.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {graduated
          ? "You made it through all sixty. This page is a record of that, not a countdown anymore."
          : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left. Not a folk rule, sixty days is where the research on no-contact recovery actually lands.`}
      </p>

      <div className="mt-6 grid grid-cols-10 gap-1.5">
        {days.map((d) => {
          const isPast = d < currentDay;
          const isToday = d === currentDay && !graduated;
          const isSlipped = slipped.has(d);
          const isMilestone = milestoneDays.includes(d as (typeof milestoneDays)[number]);
          const filled = isPast || isToday || graduated;
          const isSelected = d === selectedDay;

          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(isSelected ? null : d)}
              aria-label={
                isSlipped
                  ? `Day ${d}, logged a slip, streak continued`
                  : isMilestone
                    ? `Day ${d}, milestone`
                    : `Day ${d}`
              }
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square cursor-pointer items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filled ? "bg-sun text-primary-foreground" : "bg-muted text-muted-foreground",
                isToday && "ring-2 ring-apricot ring-offset-2 ring-offset-background",
                isSlipped && "bg-butter text-ink",
                isMilestone && !filled && "border border-dashed border-apricot/50",
                isSelected && !isToday && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              {d}
              {isSlipped && (
                <span className="absolute -right-0.5 -top-0.5 text-[8px] text-ink">*</span>
              )}
            </button>
          );
        })}
      </div>

      {!graduated && (
        <LogSlipDialog
          key={currentDaySlip?.id ?? "new"}
          occurredOn={dayToDate(startDate, currentDay)}
          dayNumber={currentDay}
          slipId={currentDaySlip?.id}
          initialNote={currentDaySlip?.note ?? undefined}
          triggerClassName={cn(
            buttonVariants({ size: "lg" }),
            "mt-4 w-full bg-butter text-ink hover:bg-butter/90",
          )}
          trigger={
            currentDaySlip ? "See or edit what you logged today" : "Slipped today? Log it - nothing resets."
          }
        />
      )}

      {sel !== null && (
        <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <p className="text-sm font-semibold text-muted-foreground">
            Day {sel} · {dayLabel(startDate, sel)}
          </p>
          <p className="mt-1.5 text-sm text-foreground">
            {selIsSlipped
              ? "Logged a slip this day. The streak kept counting - that's the whole point."
              : selIsReached
                ? sel === currentDay && !graduated
                  ? "Today. Still yours."
                  : "Clean day. Done and counted."
                : "Not here yet."}
          </p>
          {selIsSlipped && (
            <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-muted/60 p-3.5 text-sm text-foreground/90">
              {selSlip?.note || "No details added."}
            </p>
          )}
          {selIsReached && (
            <LogSlipDialog
              key={selSlip?.id ?? `new-${sel}`}
              occurredOn={dayToDate(startDate, sel)}
              dayNumber={sel}
              slipId={selSlip?.id}
              initialNote={selSlip?.note ?? undefined}
              trigger={
                <span className="mt-3 inline-block cursor-pointer text-sm font-medium text-apricot-deep underline underline-offset-4">
                  {selIsSlipped ? "Edit what happened" : "Something happened this day? Log a slip"}
                </span>
              }
            />
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sun" /> Done
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-butter" /> Logged a slip, kept going
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-apricot/50 bg-transparent" />{" "}
          Milestone
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted" /> Ahead
        </span>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Tap any day to see it, or to log a slip you didn&apos;t log at the time.
      </p>

      {slipInsight && (
        <div className="mt-6 rounded-3xl border border-butter/60 bg-butter/10 p-5">
          <p className="text-sm font-semibold text-muted-foreground">
            Pattern
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {slipInsight} Worth planning around.
          </p>
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-border bg-card shadow-soft p-5">
        <p className="text-sm font-semibold text-muted-foreground">
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
          className="mt-3 inline-block text-xs font-medium text-apricot-deep underline underline-offset-4"
        >
          See all the research →
        </Link>
      </div>
    </div>
  );
}
