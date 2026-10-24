"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PaginationBar } from "@/components/common/Paginationbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCursorPagination,
  useDebouncedValue,
} from "@/hooks/Usecursorpagination";
import {
  deleteOrderApi,
  getAdminOrderSummaryApi,
  getAdminOrdersApi,
  updateOrderApi,
  updateOrderStatusApi,
  type AdminOrderRow,
  type AdminOrderStatus,
  type AdminOrdersFilters,
  type AdminPaymentStatus,
} from "@/lib/api/admin-orders.api";
import { apiErrorMessage } from "@/lib/api/orders.api";
import {
  ORDERS_KEY,
  ORDERS_SUMMARY_KEY,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  toDateParam,
} from "@/lib/admin-orders";

import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

import { OrderEditSheet } from "./OrderEditSheet";
import { OrderPaymentDialog } from "./OrderPaymentDialog";
import { OrdersManageTable } from "./OrdersManageTable";
import {
  DEFAULT_ORDER_FILTERS,
  OrdersToolbar,
  type OrderFiltersState,
} from "./OrdersToolbar";
import { OrderCancelDialog } from "./Ordercanceldialog";

export const OrdersManager = () => {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<OrderFiltersState>(
    DEFAULT_ORDER_FILTERS,
  );
  const [limit, setLimit] = useState(20);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<AdminOrderRow | null>(null);
  const [recordingPayment, setRecordingPayment] =
    useState<AdminOrderRow | null>(null);
  const [deleting, setDeleting] = useState<AdminOrderRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const search = useDebouncedValue(filters.query.trim(), 400);

  // সব ফিল্টার সার্ভারে যায়: বড় তালিকায়ও দ্রুত, আর পাতা অনুযায়ী আসে
  const list = useCursorPagination<AdminOrderRow, AdminOrdersFilters>({
    queryKey: ORDERS_KEY,
    fetcher: getAdminOrdersApi,
    filters: {
      search: search || undefined,
      status: filters.status === "all" ? undefined : filters.status,
      paymentStatus: filters.payment === "all" ? undefined : filters.payment,
      dateFrom: toDateParam(filters.from),
      dateTo: toDateParam(filters.to),
    },
    limit,
  });

  const { data: counts } = useQuery({
    queryKey: ORDERS_SUMMARY_KEY,
    queryFn: getAdminOrderSummaryApi,
    staleTime: 30 * 1000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    queryClient.invalidateQueries({ queryKey: ORDERS_SUMMARY_KEY });
  };

  const changeStatus = async (
    order: AdminOrderRow,
    status: AdminOrderStatus,
    note?: string,
  ): Promise<boolean> => {
    setBusyId(order._id);

    try {
      await updateOrderStatusApi(order._id, status, note);
      toast.success(
        `Order ${order.orderNumber} marked as ${STATUS_LABELS[status]}.`,
      );
      refresh();
      return true;
    } catch (error) {
      // যেমন: bKash/Nagad-এর পেমেন্ট "Paid" না হলে processing হয় না
      toast.error(apiErrorMessage(error, "Failed to update the status."));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = (
    order: AdminOrderRow,
    status: AdminOrderStatus,
  ) => {
    if (status === order.status || busyId) return;

    // বাতিল ফেরানো যায় না, তাই আগে নিশ্চিত করি
    if (status === "cancelled") {
      setCancelling(order);
      return;
    }

    void changeStatus(order, status);
  };

  const handleCancelConfirm = async (note?: string) => {
    if (!cancelling) return;

    const ok = await changeStatus(cancelling, "cancelled", note);
    if (ok) setCancelling(null);
  };

  const handlePaymentChange = async (
    order: AdminOrderRow,
    paymentStatus: AdminPaymentStatus,
  ) => {
    if (paymentStatus === order.paymentStatus || busyId) return;

    // আংশিক পেমেন্টে কত টাকা এসেছে জানা দরকার, তাই আগে অঙ্ক নিই
    if (paymentStatus === "partial") {
      setRecordingPayment(order);
      return;
    }

    setBusyId(order._id);

    try {
      await updateOrderApi(order._id, {
        paymentStatus,
        expectedUpdatedAt: order.updatedAt,
      });
      toast.success(
        `Payment of ${order.orderNumber} set to ${PAYMENT_STATUS_LABELS[paymentStatus]}.`,
      );
      refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update the payment."));
    } finally {
      setBusyId(null);
    }
  };

  const handleRecordPayment = async (paidAmount: number) => {
    if (!recordingPayment || busyId) return;
    const order = recordingPayment;
    setBusyId(order._id);

    try {
      await updateOrderApi(order._id, {
        paidAmount,
        expectedUpdatedAt: order.updatedAt,
      });
      toast.success(`Payment of ${order.orderNumber} updated.`);
      setRecordingPayment(null);
      refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update the payment."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteRequest = (order: AdminOrderRow) => {
    // সার্ভারও একই নিয়ম মানে: শুধু বাতিল হওয়া অর্ডার মোছা যায় (স্টক আগেই ফিরে এসেছে)
    if (order.status !== "cancelled") {
      toast.info(
        "Cancel the order first. Only cancelled orders can be deleted.",
      );
      return;
    }

    setDeleting(order);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);

    try {
      await deleteOrderApi(deleting._id);
      toast.success(`Order ${deleting.orderNumber} deleted.`);
      setDeleting(null);
      refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete the order."));
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
              Page {list.page} · {list.items.length} orders shown
            </CardDescription>
          </div>

          <OrdersToolbar
            filters={filters}
            counts={counts}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_ORDER_FILTERS)}
          />
        </CardHeader>

        <CardContent className="space-y-4">
          {list.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-md bg-muted/50"
                />
              ))}
            </div>
          ) : list.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {apiErrorMessage(list.error, "Failed to load orders.")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => list.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <div
              className={
                list.isFetching ? "opacity-60 transition-opacity" : undefined
              }
            >
              <OrdersManageTable
                orders={list.items}
                busyId={busyId}
                onStatusChange={handleStatusChange}
                onPaymentChange={handlePaymentChange}
                onRecordPayment={setRecordingPayment}
                onEdit={(order) => setEditingId(order._id)}
                onDelete={handleDeleteRequest}
              />
            </div>
          )}

          <PaginationBar
            page={list.page}
            count={list.items.length}
            total={list.total}
            limit={limit}
            onLimitChange={setLimit}
            hasPrev={list.hasPrev}
            hasNext={list.hasNext}
            onPrev={list.goPrev}
            onNext={list.goNext}
          />
        </CardContent>
      </Card>

      <OrderEditSheet orderId={editingId} onClose={() => setEditingId(null)} />

      <OrderPaymentDialog
        order={recordingPayment}
        isLoading={busyId !== null && busyId === recordingPayment?._id}
        onClose={() => setRecordingPayment(null)}
        onConfirm={handleRecordPayment}
      />

      <OrderCancelDialog
        order={cancelling}
        isLoading={busyId !== null && busyId === cancelling?._id}
        onClose={() => setCancelling(null)}
        onConfirm={handleCancelConfirm}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleting(null);
        }}
        title="Delete this order?"
        description={`Order ${deleting?.orderNumber ?? ""} will be removed. This action cannot be undone.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
};
