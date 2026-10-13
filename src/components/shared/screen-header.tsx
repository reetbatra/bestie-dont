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
    <div className="flex items-start justify-between gap-4 px-6 pb-6 pt-10">
      <div>
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Home
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-balance">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
