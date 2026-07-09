import { Skeleton } from "@/components/ui/skeleton";

export default function RecordLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-10">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="mt-3 h-7 w-40" />
      <Skeleton className="mt-2 h-3 w-56" />
      <Skeleton className="mt-6 h-9 w-full rounded-full" />
      <div className="mt-4 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
