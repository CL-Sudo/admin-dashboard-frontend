import { Skeleton } from '@/components/ui/skeleton';

export default function ChartSkeleton() {
  return (
    <div className="h-[320px] w-full space-y-3">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-[280px] w-full" />
    </div>
  );
}
