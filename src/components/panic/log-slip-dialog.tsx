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
import { logSlip, updateSlip, deleteSlip } from "@/lib/actions/panic";

/**
 * Two entry points share this dialog: the panic flow (no `occurredOn`,
 * logs for right now, exits to /home) and the calendar (backdated to a
 * tapped day, stays put and refreshes so the day turns yellow in place).
 *
 * Passing `slipId` switches this into edit mode: the note is pre-filled
 * from `initialNote` and submitting calls `updateSlip` instead of
 * `logSlip`. Without it, a slip that's already been logged for a day was
 * a dead end - no way to see what you wrote or change it.
 */
export function LogSlipDialog({
  trigger,
  triggerClassName,
  occurredOn,
  dayNumber,
  slipId,
  initialNote,
}: {
  trigger: React.ReactNode;
  /** Styles the trigger button itself - DialogTrigger renders a native
   * <button>, so callers can't nest a <Button> inside `trigger`. */
  triggerClassName?: string;
  occurredOn?: string;
  dayNumber?: number;
  slipId?: string;
  initialNote?: string;
}) {
  const router = useRouter();
  const isEditing = slipId !== undefined;
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setNote(initialNote ?? "");
      setConfirmingDelete(false);
      setError(null);
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateSlip(slipId, note.trim())
        : await logSlip(note.trim(), occurredOn);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (isEditing || occurredOn) {
        router.refresh();
      } else {
        router.push("/home");
      }
    });
  }

  function handleDelete() {
    if (!isEditing) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSlip(slipId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger className={triggerClassName}>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "What happened" : "Okay. It happened."}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing what you logged for day ${dayNumber}. Nothing resets here.`
              : dayNumber
                ? `Logging it for day ${dayNumber}. Nothing resets here - the streak continues.`
                : "Log it, learn it, streak continues. Nothing resets here."}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened? (optional)"
          className="min-h-28 resize-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {isEditing && confirmingDelete ? (
            <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs text-foreground/80">Remove this log for good?</p>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? "Removing…" : "Yes, un-log it"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button size="lg" onClick={handleSubmit} disabled={isPending} className="w-full text-base">
                {isPending ? "Saving…" : isEditing ? "Save" : "Log it"}
              </Button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={isPending}
                  className="min-h-11 cursor-pointer text-sm font-medium text-muted-foreground underline underline-offset-4"
                >
                  Un-log this slip
                </button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
