import { Skeleton } from "@/components/Skeleton";

export default function LinkAnalyticsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="card flex items-center gap-5">
        <Skeleton className="h-20 w-20 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  );
}
