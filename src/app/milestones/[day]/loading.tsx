import { Skeleton } from "@/components/ui/skeleton";

export default function MilestoneLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center px-6 pb-8 pt-10 text-center">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-2 h-8 w-56" />
      <Skeleton className="mt-8 aspect-[9/16] w-full rounded-3xl" />
      <Skeleton className="mt-8 h-11 w-full rounded-2xl" />
    </div>
  );
}
