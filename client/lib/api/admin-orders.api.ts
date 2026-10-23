// lib/api/admin-orders.api.ts
// ADMIN ONLY — customer-facing create/get ফাংশন orders.api.ts-এ আছে, সেগুলো এখানে নয়।

import { API } from "@/lib/axios";
import type { OrderView } from "./orders.api";

/* ============================================================
   Types — backend admin projection মেলানো
   ============================================================ */

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "cod" | "bkash" | "nagad" | "card";

export interface TimelineEntry {
  event: string;
  at: string;
  by?: string;
  note?: string;
}

// Customer OrderView + admin-only fields
export interface AdminOrder extends OrderView {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentSenderPhone?: string;
  adminNote?: string;
  updatedAt: string;
  /** শুধু detail endpoint-এ আসে (list projection-এ বাদ) */
  timeline?: TimelineEntry[];
}

export interface AdminOrderListResult {
  items: AdminOrder[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface OrderSummary {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

export interface AdminOrdersQuery {
  limit?: number;
  cursor?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: string; // YYYY-MM-DD or ISO
  dateTo?: string;
}

export interface UpdateOrderStatusBody {
  status: OrderStatus;
  note?: string;
}

export interface UpdateOrderBody {
  items?: { productId: string; variantId: string; quantity: number }[];
  shippingAddress?: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    district?: string;
    postalCode?: string;
  };
  shippingFee?: number;
  paymentStatus?: PaymentStatus;
  adminNote?: string;
  /** optimistic lock — form খোলার সময়কার updatedAt */
  expectedUpdatedAt?: string;
}

/* ============================================================
   Unwrap helper (orders.api.ts-এর মতোই)
   ============================================================ */

const unwrap = <T>(res: { data: unknown }): T => {
  const body = res.data as { data?: unknown };
  return (body?.data ?? body) as T;
};

/* ============================================================
   Queries
   ============================================================ */

export const fetchAdminOrders = (
  params: AdminOrdersQuery,
): Promise<AdminOrderListResult> =>
  API.get("/orders/admin/list", { params }).then((res) =>
    unwrap<AdminOrderListResult>(res),
  );

export const fetchAdminOrder = (id: string): Promise<AdminOrder> =>
  API.get(`/orders/admin/${id}`).then((res) => unwrap<AdminOrder>(res));

export const fetchOrderSummary = (): Promise<OrderSummary> =>
  API.get("/orders/admin/summary").then((res) => unwrap<OrderSummary>(res));

/* ============================================================
   Mutations
   ============================================================ */

export const updateOrderStatusApi = (
  id: string,
  body: UpdateOrderStatusBody,
): Promise<AdminOrder> =>
  API.patch(`/orders/${id}/status`, body).then((res) =>
    unwrap<AdminOrder>(res),
  );

export const updateOrderApi = (
  id: string,
  body: UpdateOrderBody,
): Promise<AdminOrder> =>
  API.patch(`/orders/${id}`, body).then((res) => unwrap<AdminOrder>(res));

export const deleteOrderApi = (id: string): Promise<{ id: string }> =>
  API.delete(`/orders/${id}`).then((res) => unwrap<{ id: string }>(res));
