import { API } from "@/lib/axios";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "bkash" | "nagad" | "card";

export interface OrderItem {
  product: string;
  variant: string;
  name: string;
  slug: string;
  image?: string;
  size: string;
  color?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district?: string;
  postalCode?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  customer: { name: string; phone: string; email: string };
  shippingAddress: OrderShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  paymentSenderPhone?: string;
  note?: string;
  adminNote?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResult {
  items: Order[];
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

export interface CreateOrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItemInput[];
  shippingAddress: OrderShippingAddress;
  paymentMethod?: Exclude<PaymentMethod, "card">;
  paymentTransactionId?: string;
  paymentSenderPhone?: string;
  note?: string;
}

export interface MyOrdersFilters {
  status?: OrderStatus;
  cursor?: string;
  limit?: number;
}

export interface AdminOrdersFilters extends MyOrdersFilters {
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  note?: string;
}

export interface UpdateOrderPayload {
  items?: CreateOrderItemInput[];
  shippingAddress?: OrderShippingAddress;
  shippingFee?: number;
  paymentStatus?: PaymentStatus;
  adminNote?: string;
  expectedUpdatedAt?: string;
}

// ───────────────────── Customer ─────────────────────

export const createOrderApi = (
  payload: CreateOrderPayload,
  idempotencyKey: string,
): Promise<Order> =>
  API.post<Order>("/orders", payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  }).then((r) => r.data);

export const getMyOrdersApi = (
  filters: MyOrdersFilters = {},
): Promise<OrderListResult> =>
  API.get<OrderListResult>("/orders/my", { params: filters }).then(
    (r) => r.data,
  );

export const getMyOrderApi = (id: string): Promise<Order> =>
  API.get<Order>(`/orders/my/${id}`).then((r) => r.data);

export const cancelMyOrderApi = (id: string): Promise<Order> =>
  API.patch<Order>(`/orders/my/${id}/cancel`).then((r) => r.data);

// ───────────────────── Admin ─────────────────────

export const getAdminOrdersApi = (
  filters: AdminOrdersFilters = {},
): Promise<OrderListResult> =>
  API.get<OrderListResult>("/orders/admin/list", { params: filters }).then(
    (r) => r.data,
  );

export const getAdminOrderSummaryApi = (): Promise<OrderSummary> =>
  API.get<OrderSummary>("/orders/admin/summary").then((r) => r.data);

export const getAdminOrderApi = (id: string): Promise<Order> =>
  API.get<Order>(`/orders/admin/${id}`).then((r) => r.data);

export const updateOrderStatusApi = (
  id: string,
  payload: UpdateOrderStatusPayload,
): Promise<Order> =>
  API.patch<Order>(`/orders/${id}/status`, payload).then((r) => r.data);

export const updateOrderApi = (
  id: string,
  payload: UpdateOrderPayload,
): Promise<Order> =>
  API.patch<Order>(`/orders/${id}`, payload).then((r) => r.data);

export const deleteOrderApi = (id: string): Promise<{ id: string }> =>
  API.delete<{ id: string }>(`/orders/${id}`).then((r) => r.data);
