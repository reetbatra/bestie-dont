"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setNotificationPreference } from "@/lib/actions/onboarding";
import { updateHisName, exportUserData, deleteAccount, type SettingsData } from "@/lib/actions/settings";
import { signOut } from "@/lib/actions/auth";
import { CrisisLink } from "@/components/shared/crisis-link";

export function SettingsView({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const [notifOptIn, setNotifOptIn] = useState(settings.notifOptIn);
  const [hisName, setHisName] = useState(settings.hisName ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [isExporting, startExport] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleNotifToggle(checked: boolean) {
    setNotifOptIn(checked);
    startTransition(async () => {
      await setNotificationPreference(checked);
    });
  }

  function handleSaveName() {
    startTransition(async () => {
      await updateHisName(hisName);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    });
  }

  function handleExport() {
    startExport(async () => {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bestie-dont-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteAccount();
      if (result.success) {
        router.push("/");
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-16">
      <ScreenHeader title="Settings" />

      <div className="flex flex-col gap-6 px-6">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notifications
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily check-in and milestone hype</p>
              <p className="text-xs text-muted-foreground">Nothing spammy. Ever.</p>
            </div>
            <Switch checked={notifOptIn} onCheckedChange={handleNotifToggle} />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            His name
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            We call him &quot;him&quot; everywhere by default. Seeing his name less is the point,
            but it&apos;s your call.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={hisName}
              onChange={(e) => setHisName(e.target.value)}
              placeholder="Leave blank to keep it as &quot;him&quot;"
            />
            <Button variant="secondary" onClick={handleSaveName}>
              {nameSaved ? "Saved" : "Save"}
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your data
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Everything you&apos;ve written, encrypted at rest, never used to train anything, never
            sold. Export it whenever you want.
          </p>
          <Button variant="secondary" className="mt-3 w-full" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Preparing…" : "Export my data"}
          </Button>
        </section>

        <section className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Delete account
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Deletes everything, immediately, with no way back. Export first if you want a copy.
          </p>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger className="mt-3 w-full rounded-lg border border-destructive/40 bg-transparent px-3 py-2 text-sm font-medium text-destructive">
              Delete my account
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>This can&apos;t be undone.</DialogTitle>
                <DialogDescription>
                  Type DELETE to permanently remove your account and everything in it.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
              />
              <DialogFooter>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deleteConfirm !== "DELETE" || isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "Deleting…" : "Permanently delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => {
            void signOut();
            router.push("/");
          }}
        >
          Sign out
        </Button>

        <CrisisLink className="text-center" />
      </div>
    </div>
  );
}
