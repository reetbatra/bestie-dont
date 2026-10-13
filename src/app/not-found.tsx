import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LostScene } from "@/components/doodles/scenes";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-6 pb-8 pt-10 text-center">
      <LostScene className="mb-4 w-full max-w-72" />
      <p className="font-display text-2xl font-bold text-pink">Huh.</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-balance">
        This page wandered off.
      </h1>
      <p className="mt-3 max-w-[36ch] text-sm text-muted-foreground">
        Not you, not your fault. The page you&apos;re looking for isn&apos;t here.
      </p>
      <Button size="lg" className="mt-8 w-full" render={<Link href="/home" />}>
        Take me home
      </Button>
    </div>
  );
}
