// lib/api/track-order.api.ts

import { API } from "@/lib/axios";
import type {
  AdminOrderStatus,
  AdminPaymentMethod,
  AdminPaymentStatus,
} from "@/lib/api/admin-orders.api";

export type TrackedOrder = {
  orderNumber: string;
  status: AdminOrderStatus;
  createdAt: string;
  paymentMethod: AdminPaymentMethod;
  paymentStatus: AdminPaymentStatus;
  paidAmount: number;
  items: {
    name: string;
    size: string;
    color?: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  total: number;
  city?: string;
  district?: string;
};

export const trackOrderApi = (orderNumber: string): Promise<TrackedOrder> =>
  API.get(`/orders/track/${encodeURIComponent(orderNumber)}`).then(
    (res) => res.data?.data ?? res.data,
  );
