import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const StatSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-9 rounded-lg" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-36" />
    </CardContent>
  </Card>
);

const RowSkeleton = () => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="h-5 w-20 rounded-full" />
    <Skeleton className="h-4 w-16" />
  </div>
);

export const DashboardSkeleton = () => (
  <div
    className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
    aria-busy="true"
    aria-label="Loading dashboard"
  >
    <div className="space-y-2">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatSkeleton key={i} />
      ))}
    </div>

    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full" />
      </CardContent>
    </Card>

    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="mx-auto h-[176px] w-[176px] rounded-full" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader className="gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-xs" />
          <Skeleton className="h-9 w-full sm:w-72" />
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  </div>
);
