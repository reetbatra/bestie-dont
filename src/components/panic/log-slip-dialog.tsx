"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { logSlip } from "@/lib/actions/panic";

export function LogSlipDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await logSlip(note.trim());
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setNote("");
      router.push("/home");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Okay. It happened.</DialogTitle>
          <DialogDescription>
            Log it, learn it, streak continues. Nothing resets here.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened? (optional)"
          className="min-h-28 resize-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? "Logging…" : "Log it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
