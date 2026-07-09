import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function EncryptedNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Lock className="h-3 w-3 shrink-0" />
      Encrypted before it&apos;s stored.
    </p>
  );
}
