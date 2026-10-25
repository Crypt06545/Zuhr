// hooks/use-admin-orders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteOrderApi,
  getAdminOrderApi,
  getAdminOrdersApi,
  getAdminOrderSummaryApi,
  updateOrderApi,
  updateOrderStatusApi,
  type AdminOrderRow,
  type AdminOrdersFilters,
  type AdminOrderStatus,
  type AdminPaymentMethod,
  type AdminPaymentStatus,
  type UpdateOrderBody,
} from "@/lib/api/admin-orders.api";

/* ============================================================
   Types
   ============================================================ */

export type AdminOrdersQuery = AdminOrdersFilters & {
  limit?: number;
  cursor?: string;
};

export type UpdateOrderStatusBody = {
  status: AdminOrderStatus;
  note?: string;
};

/* ============================================================
   Query keys
   ============================================================ */

export const adminOrderKeys = {
  root: ["orders", "admin"] as const,
  list: (q: AdminOrdersQuery) => ["orders", "admin", "list", q] as const,
  detail: (id: string) => ["orders", "admin", "detail", id] as const,
  summary: () => ["orders", "admin", "summary"] as const,
};

/* ============================================================
   Queries
   ============================================================ */

export const useAdminOrders = (params: AdminOrdersQuery) =>
  useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => getAdminOrdersApi(params),
    placeholderData: (prev) => prev,
  });

export const useAdminOrder = (id: string, enabled = true) =>
  useQuery({
    queryKey: adminOrderKeys.detail(id),
    queryFn: () => getAdminOrderApi(id),
    enabled: enabled && !!id,
  });

export const useOrderSummary = () =>
  useQuery({
    queryKey: adminOrderKeys.summary(),
    queryFn: getAdminOrderSummaryApi,
  });

/* ============================================================
   Mutations
   ============================================================ */

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: adminOrderKeys.root });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateOrderStatusBody }) =>
      updateOrderStatusApi(id, body.status, body.note),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateOrderBody }) =>
      updateOrderApi(id, body),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrderApi(id),
    onSuccess: () => invalidateAll(qc),
  });
};

/* ============================================================
   View adapter — backend nested → UI flat
   ============================================================ */

export interface OrderRow {
  id: string; // display (orderNumber)
  _id: string; // API key for mutations
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  product: string;
  quantity: number;
  amount: number;
  status: AdminOrderStatus;
  paymentMethod: AdminPaymentMethod;
  paymentStatus: AdminPaymentStatus;
  note: string;
  date: string; // createdAt
  raw: AdminOrderRow; // form-এর জন্য
}

export const toOrderRow = (o: AdminOrderRow): OrderRow => ({
  id: o.orderNumber,
  _id: o._id,
  customer: o.shippingAddress.fullName,
  email: o.customer.email ?? "",
  phone: o.shippingAddress.phone,
  address: o.shippingAddress.addressLine,
  city: o.shippingAddress.city,
  district: o.shippingAddress.district,
  product:
    o.items.length === 1
      ? o.items[0]!.name
      : `${o.items[0]?.name ?? ""} +${o.items.length - 1} more`,
  quantity: o.items.reduce((sum, item) => sum + item.quantity, 0),
  amount: o.total,
  status: o.status,
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  note: o.adminNote ?? o.note ?? "",
  date: o.createdAt,
  raw: o,
});
