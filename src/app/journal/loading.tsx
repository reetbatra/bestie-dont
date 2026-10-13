import { Skeleton } from "@/components/ui/skeleton";

export default function JournalLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-10">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="mt-3 h-7 w-40" />
      <Skeleton className="mt-2 h-3 w-32" />
      <Skeleton className="mt-6 h-20 w-full rounded-sketch" />
      <Skeleton className="mt-4 h-40 w-full rounded-sketch-sm" />
      <Skeleton className="mt-4 h-9 w-full rounded-sketch-sm" />
    </div>
  );
}
