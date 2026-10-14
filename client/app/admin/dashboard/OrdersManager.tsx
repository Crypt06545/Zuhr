"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getErrorMessage } from "@/hooks/use-auth";
import {
  deleteOrder,
  updateOrder,
  updateOrderStatus,
} from "@/lib/api/mutations";
import type { Order, OrderStatus } from "@/lib/mock-dashboard";
import {
  applyOrderFilters,
  DEFAULT_FILTERS,
  hasActiveFilters,
  type OrderFilters,
} from "@/lib/order-filters";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { OrderEditDialog } from "./OrderEditDialog";
import { STATUS_META } from "./OrderStatusBadge";
import { OrdersManageTable } from "./OrdersManageTable";
import { OrdersToolbar } from "./OrdersToolbar";

export const OrdersManager = ({ orders }: { orders: Order[] }) => {
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [editing, setEditing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Demo mode: keeps status changes visible until the page is refreshed.
  // Once a real API is connected, remove this and call router.refresh() instead.
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, OrderStatus>
  >({});

  const rows = useMemo(
    () =>
      orders.map((o) =>
        statusOverrides[o.id] ? { ...o, status: statusOverrides[o.id] } : o,
      ),
    [orders, statusOverrides],
  );

  const visible = useMemo(
    () => applyOrderFilters(rows, filters),
    [rows, filters],
  );

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    if (status === order.status || updatingId) return;
    setUpdatingId(order.id);

    try {
      await updateOrderStatus(order.id, status);
      setStatusOverrides((prev) => ({ ...prev, [order.id]: status }));
      toast.success(
        `Order ${order.id} marked as ${STATUS_META[status].label}.`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update status."));
    } finally {
      setUpdatingId(null);
    }
  };

  // Demo mode: the list does not change. After a real API call succeeds,
  // call router.refresh() here so the page re-fetches the orders.
  const handleSave = async (updated: Order) => {
    try {
      await updateOrder(updated);
      toast.success(`Order ${updated.id} updated.`);
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update order."));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);

    try {
      await deleteOrder(deleting.id);
      toast.success(`Order ${deleting.id} deleted.`);
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete order."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>All orders</CardTitle>
            <CardDescription>
              Showing {visible.length} of {rows.length} orders
            </CardDescription>
          </div>

          <OrdersToolbar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            isFiltered={hasActiveFilters(filters)}
          />
        </CardHeader>

        <CardContent>
          <OrdersManageTable
            orders={visible}
            updatingId={updatingId}
            onStatusChange={handleStatusChange}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        </CardContent>
      </Card>

      <OrderEditDialog
        order={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleting(null);
        }}
        title="Delete this order?"
        description={`Order ${deleting?.id ?? ""} will be removed. This action cannot be undone.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
};
