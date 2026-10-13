"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LostScene } from "@/components/doodles/scenes";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-6 pb-8 pt-10 text-center">
      <LostScene note="oops." className="mb-4 w-full max-w-72" />
      <p className="font-display text-2xl font-bold text-pink">Ugh.</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-balance">
        Something broke on our end.
      </h1>
      <p className="mt-3 max-w-[36ch] text-sm text-muted-foreground">
        Not you, us. Whatever you were doing is still safe. Try again?
      </p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" render={<Link href="/home" />}>
          Take me home instead
        </Button>
      </div>
    </div>
  );
}
