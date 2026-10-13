import { Skeleton } from "@/components/ui/skeleton";

export default function VaultLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-10">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-2 h-3 w-48" />
      <Skeleton className="mt-6 h-32 w-full rounded-sketch" />
      <Skeleton className="mt-3 h-10 w-full rounded-sketch-sm" />
      <div className="mt-8 flex flex-col gap-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-sketch" />
        ))}
      </div>
    </div>
  );
}
