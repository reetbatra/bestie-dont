import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-10">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="mt-3 h-7 w-28" />
      <div className="mt-8 flex flex-col gap-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
