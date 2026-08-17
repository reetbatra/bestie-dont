import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/supabase/server";
import { SaveAccessForm } from "@/components/shared/save-access-form";
import { profilePage } from "@/lib/perf/wrap";

async function CheckoutSuccessPage() {
  const { email } = await requireSession();
  const hasEmail = Boolean(email);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-6 pb-8 pt-10 text-center">
      <p className="font-display text-2xl italic text-terracotta">You&apos;re in.</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-balance">
        The full sixty days, unlocked.
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Unlimited entries in your Record, the whole 8-week journaling arc, Vault drafts that
        resurface after 30 days, and milestone share cards. All of it, once. No renewal, nothing
        to cancel.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Thank you for trusting us with more than the money. Genuinely: we hope you graduate on day
        sixty and never need to open this again.
      </p>

      {!hasEmail && (
        <div className="mt-8 rounded-3xl border border-terracotta/30 bg-terracotta/5 p-5 text-left">
          <p className="text-sm font-semibold text-foreground">
            One more thing, before you go.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Right now your access lives in this browser only. Clear your cookies or switch phones
            and there&apos;s no way back in, even though you paid. Save your email so that can
            never happen.
          </p>
          <div className="mt-3">
            <SaveAccessForm compact />
          </div>
        </div>
      )}

      <Button size="lg" className="mt-8 w-full" render={<Link href="/home" />}>
        Take me home
      </Button>
    </div>
  );
}

export default profilePage("/checkout/success", CheckoutSuccessPage);
