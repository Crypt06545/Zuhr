"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/Usecursorpagination";
import {
  getAdminOrdersApi,
  type AdminOrdersFilters,
  type AdminOrderStatus,
} from "@/lib/api/admin-orders.api";
import { toDashboardOrder } from "@/lib/adapters/admin-order";
import { STATUS_META } from "./OrderStatusBadge";
import { OrdersTable } from "./OrdersTable";

type Filter = "all" | AdminOrderStatus;

const FILTERS: Filter[] = [
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const RECENT_LIMIT = 10;

// Dashboard থেকে dateRange নেওয়া হচ্ছে
interface OrdersSectionProps {
  dateRange?: { from?: string; to?: string };
}

export const OrdersSection = ({ dateRange }: OrdersSectionProps) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const debounced = useDebouncedValue(query, 400);

  const filters = useMemo<AdminOrdersFilters>(
    () => ({
      ...(filter !== "all" ? { status: filter } : {}),
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
      ...(dateRange?.from ? { dateFrom: dateRange.from } : {}),
      ...(dateRange?.to ? { dateTo: dateRange.to } : {}),
    }),
    [filter, debounced, dateRange],
  );

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["admin", "orders", "recent", filters],
    queryFn: () => getAdminOrdersApi({ ...filters, limit: RECENT_LIMIT }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const rows = (data?.items ?? []).map(toDashboardOrder);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="gap-4">
        <div className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>
              {isPending
                ? "Loading..."
                : `Showing up to ${RECENT_LIMIT} orders for selected date`}
            </CardDescription>
          </div>

          <Link
            href="/admin/dashboard/orders"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1",
            )}
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders..."
              className="h-9 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={filter === item ? "default" : "outline"}
                onClick={() => setFilter(item)}
              >
                {item === "all" ? "All" : STATUS_META[item].label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <OrdersTable orders={rows} isLoading={isPending || isFetching} />
      </CardContent>
    </Card>
  );
};
