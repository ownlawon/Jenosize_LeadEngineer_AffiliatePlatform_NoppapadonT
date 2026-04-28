import { Skeleton } from '@/components/Skeleton';

export default function LinksLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="card grid gap-4 md:grid-cols-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={i === 0 ? 'md:col-span-2 space-y-2' : 'space-y-2'}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="md:col-span-4 flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="card space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
