import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-6 pb-8 pt-10 text-center">
      <p className="font-display text-2xl italic text-terracotta">You&apos;re in.</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-balance">
        The full sixty days, unlocked.
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Unlimited entries in your Record, the whole journaling arc, draft resurfacing, and share
        cards. Thank you for trusting us with this.
      </p>
      <Button size="lg" className="mt-10 w-full" render={<Link href="/home" />}>
        Take me home
      </Button>
    </div>
  );
}
