import { Skeleton } from "@/components/ui/skeleton";

export default function RecoveryLoading() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col items-center justify-center px-6 pb-6 pt-8 text-center">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-3 h-8 w-full" />
      <Skeleton className="mt-2 h-8 w-3/4" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-10 h-11 w-full rounded-sketch-sm" />
    </div>
  );
}
