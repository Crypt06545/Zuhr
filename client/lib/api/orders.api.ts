// lib/api/orders.api.ts
import axios from "axios";

import { API } from "@/lib/axios";
import type { CreateOrderBody } from "@/lib/checkout";

export type OrderItemView = {
  name: string;
  slug: string;
  image?: string;
  size: string;
  color?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderView = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentMethod: "cod" | "bkash" | "nagad" | "card";
  paymentStatus: string;
  paymentTransactionId?: string;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  total: number;
  items: OrderItemView[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    district?: string;
  };
  note?: string;
  createdAt: string;
};

// ব্যাকএন্ড { message, data } দেয়; data না থাকলে পুরো body-ই ধরি
const unwrap = <T>(res: { data: unknown }): T => {
  const body = res.data as { data?: unknown };
  return (body?.data ?? body) as T;
};

export const createOrderApi = (
  body: CreateOrderBody,
  idempotencyKey: string,
): Promise<OrderView> =>
  API.post("/orders", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  }).then((res) => unwrap<OrderView>(res));

export const getMyOrderApi = (id: string): Promise<OrderView> =>
  API.get(`/orders/my/${encodeURIComponent(id)}`).then((res) =>
    unwrap<OrderView>(res),
  );

/* ---------- error helpers ---------- */

export const apiErrorStatus = (error: unknown): number | undefined =>
  axios.isAxiosError(error) ? error.response?.status : undefined;

// validation এরর অ্যারে হয়ে আসে, তাই জুড়ে এক লাইন বানাই
export const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message) return message;
    if (!error.response) return "Network error. Check your connection.";
  }

  return fallback;
};
