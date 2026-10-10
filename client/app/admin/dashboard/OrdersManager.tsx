"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

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
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { STATUS_META } from "./OrderStatusBadge";
import { OrdersManageTable } from "./OrdersManageTable";

type Filter = "all" | OrderStatus;

const FILTERS: Filter[] = [
  "all",
  "delivered",
  "shipped",
  "processing",
  "cancelled",
];

export const OrdersManager = ({
  initialOrders,
}: {
  initialOrders: Order[];
}) => {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [deleting, setDeleting] = useState<Order | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus = filter === "all" || o.status === filter;
      const matchesQuery =
        !q ||
        o.customer.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, filter]);

  const handleStatusChange = (id: string, status: OrderStatus) => {
    // Local state only: call your API here, then update state on success
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success(`Order ${id} marked as ${STATUS_META[status].label}.`);
  };

  const handleDelete = () => {
    if (!deleting) return;
    // Local state only: call your API here, then update state on success
    setOrders((prev) => prev.filter((o) => o.id !== deleting.id));
    toast.success(`Order ${deleting.id} deleted.`);
    setDeleting(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>All orders</CardTitle>
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
          <OrdersManageTable
            orders={visible}
            onStatusChange={handleStatusChange}
            onDelete={setDeleting}
          />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete this order?"
        description={`Order ${deleting?.id ?? ""} will be removed. This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  );
};
