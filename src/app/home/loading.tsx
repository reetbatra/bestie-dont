import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-40 pt-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="mt-8">
        <Skeleton className="h-24 w-32" />
        <Skeleton className="mt-3 h-3 w-10" />
        <Skeleton className="mt-4 h-4 w-56" />
      </div>
      <Skeleton className="mt-10 h-28 w-full rounded-3xl" />
    </div>
  );
}
