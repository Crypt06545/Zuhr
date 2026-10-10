import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const RowSkeleton = () => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="hidden h-4 w-24 sm:block" />
    <Skeleton className="h-8 w-28 rounded-md" />
    <Skeleton className="hidden h-4 w-16 md:block" />
    <Skeleton className="h-8 w-8 rounded-md" />
  </div>
);

export const TablePageSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div
    className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
    aria-busy="true"
    aria-label="Loading"
  >
    <div className="space-y-2">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>

    <Card>
      <CardHeader className="gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-xs" />
          <Skeleton className="h-9 w-full sm:w-80" />
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  </div>
);
