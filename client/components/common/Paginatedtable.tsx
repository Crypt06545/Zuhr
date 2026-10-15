import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface PaginatedTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  isLoading?: boolean;
  isFetching?: boolean;
  emptyText?: string;
}

// Plain table used by customers and coupons
export function PaginatedTable<T>({
  columns,
  rows,
  getKey,
  isLoading,
  isFetching,
  emptyText = "Nothing to show.",
}: PaginatedTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn("px-3 py-2 font-medium", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody
          className={cn(
            "transition-opacity",
            isFetching && !isLoading && "opacity-60",
          )}
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td colSpan={columns.length} className="px-3 py-3">
                  <div className="h-5 animate-pulse rounded bg-muted/50" />
                </td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center text-muted-foreground"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getKey(row)}
                className="border-b border-border last:border-0"
              >
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={cn("px-3 py-3 align-middle", column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
