import { Skeleton } from "@/components/ui/skeleton";

export default function MilestoneLoading() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col items-center px-6 pb-6 pt-8 text-center">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-2 h-8 w-56" />
      <div className="mt-5 flex min-h-0 w-full flex-1 items-center justify-center">
        <Skeleton className="aspect-[9/16] h-full max-w-full rounded-sketch" />
      </div>
      <Skeleton className="mt-5 h-11 w-full rounded-sketch-sm" />
    </div>
  );
}
