"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkEmail } from "@/lib/actions/auth";

/**
 * Converts the anonymous session into a permanent one. Without this, her
 * account is just a browser cookie - clear cookies, switch devices, or
 * reinstall the PWA and a paid account becomes unrecoverable, with no email
 * or password on file with us to prove she paid. This is the one screen
 * that closes that gap.
 */
export function SaveAccessForm({
  onDone,
  compact = false,
}: {
  onDone?: () => void;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSubmit() {
    if (!email.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await linkEmail(email.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setSent(true);
      // Give her time to actually read the confirmation before the dialog
      // (if any) auto-closes out from under it.
      setTimeout(() => onDone?.(), 2500);
    });
  }

  if (sent) {
    return (
      <p className={compact ? "text-xs text-forest" : "text-sm text-forest"}>
        Check {email} for a confirmation link. Until you click it, this device stays your access
        - nothing changes today.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={compact ? "h-9 text-sm" : undefined}
        />
        <Button
          size={compact ? "sm" : "default"}
          onClick={handleSubmit}
          disabled={isPending || !email.trim()}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
