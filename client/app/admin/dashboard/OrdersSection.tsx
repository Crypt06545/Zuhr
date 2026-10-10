"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Order, OrderStatus } from "@/lib/mock-dashboard";
import { STATUS_META } from "./OrderStatusBadge";
import { OrdersTable } from "./OrdersTable";

type Filter = "all" | OrderStatus;

const FILTERS: Filter[] = [
  "all",
  "delivered",
  "shipped",
  "processing",
  "cancelled",
];

export const OrdersSection = ({ orders }: { orders: Order[] }) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus = filter === "all" || o.status === filter;
      const matchesQuery =
        !q ||
        o.customer.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, filter]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>
            Showing {visible.length} of {orders.length} orders
          </CardDescription>
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
        <OrdersTable orders={visible} />
      </CardContent>
    </Card>
  );
};
