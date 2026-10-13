"use client";

import Link from "next/link";
import { Home, NotebookText, BookOpen, PenLine, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { DETOX_RULES } from "@/lib/streak";
import { HomeBadge } from "@/components/doodles/scenes";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/record", label: "Record", icon: NotebookText },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/vault", label: "Vault", icon: PenLine },
];

export function HomeShell({
  day,
  daysLeft,
  programLengthDays,
  isExtended,
  subtext,
  promptText,
  promptAnswered,
  pendingMilestone,
  pendingRecovery,
}: {
  day: number;
  daysLeft: number;
  programLengthDays: number;
  isExtended: boolean;
  subtext: string;
  promptText: string | null;
  promptAnswered: boolean;
  pendingMilestone: number | null;
  pendingRecovery: { slipId: string; daysSince: number } | null;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-40 pt-10">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-extrabold leading-none text-foreground">
            bestie, don&apos;t.
          </p>
          <Link href="/settings" className="text-muted-foreground" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-display text-8xl font-extrabold tabular-nums leading-none text-foreground">
                {day}
              </span>
              <p className="mt-1 text-base text-muted-foreground">
                {day === 1 ? "day" : "days"}
              </p>
            </div>
            <HomeBadge day={day} className="h-28 w-28" />
          </div>
          <p className="mt-4 max-w-[36ch] text-base text-foreground">{subtext}</p>
        </div>

        <Link
          href="/calendar"
          className="mt-6 flex items-center justify-between rounded-3xl border border-border bg-card shadow-soft p-5 transition-colors hover:border-apricot/40"
        >
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              The {programLengthDays} days
            </p>
            <p className="mt-1 text-sm text-foreground">
              {daysLeft > 0
                ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
                : `You made it through all ${programLengthDays === 90 ? "ninety" : "sixty"}.`}
            </p>
          </div>
          <span className="text-sm font-medium text-apricot-deep">View →</span>
        </Link>

        {isExtended && daysLeft > 0 && (
          <div className="mt-6 rounded-3xl border border-apricot/30 bg-peach/40 p-5">
            <p className="text-sm font-semibold text-muted-foreground">
              Detox mode
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-foreground">
              {DETOX_RULES.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="text-apricot-deep">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pendingRecovery && (
          <Link
            href={`/recovery/${pendingRecovery.slipId}`}
            className="mt-8 block rounded-3xl border border-sage/40 bg-sage/10 p-5 transition-colors hover:border-sage/60"
          >
            <p className="text-sm font-semibold text-muted-foreground">
              Checking in
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-foreground">
              Still here.
            </p>
          </Link>
        )}

        {pendingMilestone && (
          <Link
            href={`/milestones/${pendingMilestone}`}
            className="mt-8 block rounded-3xl border border-butter/60 bg-butter/15 p-5 transition-colors hover:border-butter"
          >
            <p className="text-sm font-semibold text-muted-foreground">
              Milestone
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-foreground">
              Day {pendingMilestone}. Come see.
            </p>
          </Link>
        )}

        {promptText && (
          <Link
            href="/journal"
            className="mt-10 block rounded-3xl border border-border bg-card shadow-soft p-5 transition-colors hover:border-apricot/40"
          >
            <p className="text-sm font-semibold text-muted-foreground">
              Today&apos;s prompt
            </p>
            <p className="mt-2 text-base leading-snug text-foreground">{promptText}</p>
            <p className="mt-3 text-sm font-medium text-apricot-deep">
              {promptAnswered ? "Read what you wrote →" : "Start writing →"}
            </p>
          </Link>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px]">
        <div className="bg-gradient-to-t from-background via-background/95 to-background/0 px-6 pb-3 pt-6">
          <Link
            href="/panic/reset"
            className="block w-full rounded-full bg-sun px-6 py-4 text-center font-display text-lg font-extrabold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
          >
            don&apos;t text him. come here.
          </Link>
          <nav className="mt-3 flex items-center justify-around">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs text-muted-foreground transition-colors",
                  href === "/home" && "font-bold text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
