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

      {/* Match the actual 6-column LinksTable: Product · Campaign · Short
          link · Marketplace · Clicks · Copy. Each cell mirrors the real
          two-line layout (image + title, name + utm slug, code + host). */}
      <div className="card space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex flex-1 items-center gap-2.5">
              <Skeleton className="h-9 w-9 flex-shrink-0 rounded" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="hidden flex-1 flex-col gap-1.5 sm:flex">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex w-32 flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
