import { cn } from "@/lib/cn";

/**
 * Generic shimmering placeholder. Compose to mirror the eventual layout so
 * the route-transition feels like the real page is filling in instead of
 * popping into existence.
 */
export function Skeleton({ className }: { className?: string }) {
  // `.skeleton` applies an opacity pulse + horizontal shimmer sweep (defined
  // in globals.css). bg-slate-200 is the fallback colour for users with
  // prefers-reduced-motion (animations disabled).
  // role="status" + aria-label tell assistive tech that this is a loading
  // affordance instead of an empty box.
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-live="polite"
      className={cn("skeleton rounded bg-slate-200", className)}
    />
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonCard({ children }: { children?: React.ReactNode }) {
  return <div className="card space-y-3">{children}</div>;
}
