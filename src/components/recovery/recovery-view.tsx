import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { RecoveryData } from "@/lib/actions/recovery";

export function RecoveryView({ data }: { data: RecoveryData }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col items-center justify-center px-6 pb-6 pt-8 text-center">
      <p className="font-display text-2xl font-bold text-blue">Still here.</p>
      <h1 className="mt-3 max-w-[28ch] text-balance font-display text-3xl font-semibold">
        {data.daysSince} {data.daysSince === 1 ? "day" : "days"} since that slip, and you kept going anyway.
      </h1>
      <p className="mt-4 max-w-[36ch] text-base text-muted-foreground">
        No fanfare here, just a note that it happened, it passed, and you&apos;re still on your own side.
      </p>
      <div className="mt-10 w-full">
        <Button size="lg" render={<Link href="/home" />} className="w-full">
          Keep going
        </Button>
      </div>
    </div>
  );
}
