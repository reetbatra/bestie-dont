"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Smartphone, Share, MoreVertical } from "lucide-react";
import { updateHisName, exportUserData, deleteAccount, type SettingsData } from "@/lib/actions/settings";
import { signOut } from "@/lib/actions/auth";
import { CrisisLink } from "@/components/shared/crisis-link";
import { SaveAccessForm } from "@/components/shared/save-access-form";
import { useInstallPrompt } from "@/components/pwa/install-provider";

export function SettingsView({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [hisName, setHisName] = useState(settings.hisName ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [isExporting, startExport] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [signOutWarningOpen, setSignOutWarningOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleSignOutClick() {
    if (!settings.email) {
      setSignOutWarningOpen(true);
      return;
    }
    void signOut();
    router.push("/");
  }

  async function handleInstallClick() {
    if (!canInstall) {
      toast("Look for “Install app” or “Add to Home screen” in your browser's menu (usually the ⋮ in the top corner).");
      return;
    }
    await promptInstall();
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
        <Link
          href="/why"
          className="rounded-sketch border border-pink/30 bg-pink/5 p-5 transition-colors hover:border-pink/50"
        >
          <p className="font-display text-xl font-bold leading-tight text-pink">
            Not just vibes
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            Why this app works, backed by research →
          </p>
        </Link>

        <section className="rounded-sketch border border-border bg-card p-5">
          <p className="font-display text-xl font-bold leading-tight text-blue">
            Notifications
          </p>
          <p className="mt-2 text-sm font-medium">Zero. On purpose.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We don&apos;t ping, buzz, or check in on you. This app doesn&apos;t get to be one more
            thing pulling your attention back to your phone.
          </p>
        </section>

        <section className="rounded-sketch border border-border bg-card p-5">
          <p className="font-display text-xl font-bold leading-tight text-blue">
            Account access
          </p>
          {settings.email ? (
            <p className="mt-2 text-sm text-foreground">Recoverable at {settings.email}.</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                No email saved. Your account only exists in this browser right now - clear
                cookies or switch devices and it&apos;s gone for good, including anything you paid
                for.
              </p>
              <div className="mt-3">
                <SaveAccessForm compact />
              </div>
            </>
          )}
        </section>

        {!isInstalled && (
          <section className="rounded-sketch border border-border bg-card p-5">
            <p className="font-display text-xl font-bold leading-tight text-blue">
              Put your bestie one tap away
            </p>
            {isIOS ? (
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sketch-sm bg-butter/40 text-ink">
                  <Share className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap the Share icon in Safari, then &quot;Add to Home Screen&quot;.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sketch-sm bg-butter/40 text-ink">
                  {canInstall ? (
                    <Smartphone className="h-5 w-5" />
                  ) : (
                    <MoreVertical className="h-5 w-5" />
                  )}
                </div>
                <p className="flex-1 text-xs text-muted-foreground">
                  {canInstall
                    ? "One tap and it's on your homescreen, like a real app."
                    : "Check your browser menu to install."}
                </p>
                <Button size="sm" variant="secondary" onClick={handleInstallClick}>
                  Add
                </Button>
              </div>
            )}
          </section>
        )}

        <section className="rounded-sketch border border-border bg-card p-5">
          <p className="font-display text-xl font-bold leading-tight text-blue">
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

        <section className="rounded-sketch border border-border bg-card p-5">
          <p className="font-display text-xl font-bold leading-tight text-blue">
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

        <section className="rounded-sketch border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-display text-xl font-bold leading-tight text-red">
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

        <Button variant="ghost" className="text-muted-foreground" onClick={handleSignOutClick}>
          Sign out
        </Button>

        <CrisisLink className="text-center" />
      </div>

      <Dialog open={signOutWarningOpen} onOpenChange={setSignOutWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wait - you&apos;ll lose this.</DialogTitle>
            <DialogDescription>
              You have no email saved. Signing out means there&apos;s no way back into this
              account, including anything you&apos;ve paid for. Save an email first, or sign out
              anyway if you&apos;re sure.
            </DialogDescription>
          </DialogHeader>
          <SaveAccessForm onDone={() => setSignOutWarningOpen(false)} />
          <Button
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => {
              void signOut();
              router.push("/");
            }}
          >
            Sign out anyway, I understand
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
