import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => (
  <div
    className="mx-auto max-w-4xl space-y-5 px-4 py-8"
    aria-busy="true"
    aria-label="Loading invoice"
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
    <Skeleton className="h-[820px] w-full rounded-2xl" />
  </div>
);

export default Loading;
