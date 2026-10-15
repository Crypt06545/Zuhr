import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationBarProps {
  page: number;
  count: number; // rows on this page
  total?: number; // optional total, shown only if the backend sends it
  limit: number;
  pageSizes?: number[];
  onLimitChange: (limit: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const PaginationBar = ({
  page,
  count,
  total,
  limit,
  pageSizes = [10, 20, 50],
  onLimitChange,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: PaginationBarProps) => {
  const start = (page - 1) * limit + 1;
  const summary =
    count === 0
      ? "No results"
      : total !== undefined
        ? `${start}-${start + count - 1} of ${total}`
        : `Page ${page} · ${count} items`;

  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{summary}</p>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => value && onLimitChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!hasPrev}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <span className="min-w-12 text-center text-sm font-medium">
            Page {page}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
