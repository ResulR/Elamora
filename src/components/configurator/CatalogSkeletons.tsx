import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeletonGrid({
  count,
  columnsClassName,
}: {
  count: number;
  columnsClassName: string;
}) {
  return (
    <div className={columnsClassName} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border/50 bg-surface p-3">
          <Skeleton className="aspect-square w-full rounded-lg mb-3" />
          <Skeleton className="h-3 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ColorSkeletons() {
  return (
    <div className="flex flex-wrap gap-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-10 rounded-full" />
      ))}
    </div>
  );
}
