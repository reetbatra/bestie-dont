import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-10">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="mt-3 h-7 w-40" />
      <Skeleton className="mt-2 h-3 w-64" />
      <div className="mt-6 grid grid-cols-10 gap-1.5">
        {Array.from({ length: 60 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
