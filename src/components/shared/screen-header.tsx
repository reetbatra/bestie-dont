import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  subtitle,
  action,
  backHref = "/home",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pb-6 pt-[max(1.75rem,env(safe-area-inset-top))]">
      <div>
        <Link
          href={backHref}
          className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full pl-1 pr-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-balance">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 pt-[3.25rem]">{action}</div>}
    </div>
  );
}
