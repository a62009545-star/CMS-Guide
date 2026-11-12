import { cn } from '@/lib/utils';

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton', className)} aria-hidden />;

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      <div className="card space-y-3 p-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}
