// lib/api/admin-orders.api.ts
// অ্যাডমিনের অর্ডার API (শুধু অ্যাডমিন টোকেনে চলে; ব্যাকএন্ডে AdminOnly গার্ড আছে)
import type { CursorPage } from "@/hooks/Usecursorpagination";
import { API } from "@/lib/axios";

export type AdminOrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type AdminPaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "failed"
  | "refunded";

export type AdminPaymentMethod = "cod" | "bkash" | "nagad" | "card";

export type AdminOrderItem = {
  product: string;
  variant: string;
  name: string;
  slug: string;
  image?: string;
  size: string;
  color?: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  lineTotal: number;
};

export type AdminShippingAddress = {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district?: string;
  postalCode?: string;
};

export type OrderTimelineEntry = {
  event: string;
  at: string;
  // detail API নামসহ অবজেক্ট দেয়; ইউজার মুছে গেলে null
  by?: { _id: string; name?: string } | string | null;
  note?: string;
};

// তালিকার একটি সারি (timeline ছাড়া)
export type AdminOrderRow = {
  _id: string;
  orderNumber: string;
  customer: { name: string; phone: string; email: string };
  shippingAddress: AdminShippingAddress;
  items: AdminOrderItem[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  total: number;
  status: AdminOrderStatus;
  paymentMethod: AdminPaymentMethod;
  paymentStatus: AdminPaymentStatus;
  // এ পর্যন্ত জমা টাকা। পুরনো অর্ডারে না-ও থাকতে পারে (receivedAmount দেখুন)
  paidAmount?: number;
  paymentTransactionId?: string;
  paymentSenderPhone?: string;
  note?: string;
  adminNote?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
};

// একটি অর্ডারের পুরো তথ্য (timeline সহ)
export type AdminOrderDetail = AdminOrderRow & {
  timeline: OrderTimelineEntry[];
};

export type AdminOrdersFilters = {
  status?: AdminOrderStatus;
  paymentStatus?: AdminPaymentStatus;
  search?: string;
  dateFrom?: string; // "2026-10-16" = বাংলাদেশের ওই দিনের শুরু
  dateTo?: string; // "2026-10-16" = বাংলাদেশের ওই পুরো দিন
};

export type OrderSummaryCounts = {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
};

export type UpdateOrderBody = {
  items?: { productId: string; variantId: string; quantity: number }[];
  shippingAddress?: AdminShippingAddress;
  shippingFee?: number;
  paymentStatus?: AdminPaymentStatus;
  // এ পর্যন্ত মোট জমা টাকা (নতুন কিস্তি নয়); সার্ভার এ থেকে pending/partial/paid ঠিক করে
  paidAmount?: number;
  adminNote?: string;
  // অন্য কেউ এর মধ্যে বদলালে সার্ভার 409 দেয়, চুপচাপ ওপর দিয়ে লেখে না
  expectedUpdatedAt?: string;
};

// ব্যাকএন্ড { message, data } দিতে পারে; data না থাকলে পুরো body-ই ধরি
const unwrap = <T>(res: { data: unknown }): T => {
  const body = res.data as { data?: unknown };
  return (body?.data ?? body) as T;
};

// axios undefined param পাঠায় না, তাই খালি ফিল্টার যায় না
export const getAdminOrdersApi = (
  params: AdminOrdersFilters & { limit?: number; cursor?: string },
): Promise<CursorPage<AdminOrderRow>> =>
  API.get("/orders/admin/list", { params }).then((res) =>
    unwrap<CursorPage<AdminOrderRow>>(res),
  );

export const getAdminOrderApi = (id: string): Promise<AdminOrderDetail> =>
  API.get(`/orders/admin/${encodeURIComponent(id)}`).then((res) =>
    unwrap<AdminOrderDetail>(res),
  );

export const getAdminOrderSummaryApi = (): Promise<OrderSummaryCounts> =>
  API.get("/orders/admin/summary").then((res) =>
    unwrap<OrderSummaryCounts>(res),
  );

export const updateOrderStatusApi = (
  id: string,
  status: AdminOrderStatus,
  note?: string,
) =>
  API.patch(`/orders/${encodeURIComponent(id)}/status`, {
    status,
    ...(note && { note }),
  }).then((res) => unwrap<AdminOrderRow>(res));

export const updateOrderApi = (id: string, body: UpdateOrderBody) =>
  API.patch(`/orders/${encodeURIComponent(id)}`, body).then((res) =>
    unwrap<AdminOrderRow>(res),
  );

export const deleteOrderApi = (id: string) =>
  API.delete(`/orders/${encodeURIComponent(id)}`).then((res) => res.data);
