// lib/admin-orders.ts
import type {
  AdminOrderStatus,
  AdminPaymentMethod,
  AdminPaymentStatus,
} from "@/lib/api/admin-orders.api";

export const ORDER_STATUSES: AdminOrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUSES: AdminPaymentStatus[] = [
  "pending",
  "partial",
  "paid",
  "failed",
  "refunded",
];

export const PAYMENT_STATUS_LABELS: Record<AdminPaymentStatus, string> = {
  pending: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_STYLES: Record<AdminPaymentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  partial: "bg-blue-500/10 text-blue-600",
  paid: "bg-emerald-500/10 text-emerald-600",
  failed: "bg-red-500/10 text-red-600",
  refunded: "bg-slate-500/10 text-slate-600",
};

export const PAYMENT_METHOD_LABELS: Record<AdminPaymentMethod, string> = {
  cod: "Cash on delivery",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
};

// bKash/Nagad: অ্যাডমিন Transaction ID মিলিয়ে "Paid" করার আগে অর্ডার processing-এ যায় না
export const isMobilePayment = (method: AdminPaymentMethod) =>
  method === "bkash" || method === "nagad";

/* ============================================================
   অ্যাডভান্স / জমা টাকার হিসাব (ব্যাকএন্ডের orders.rules.ts-এর সঙ্গে মেলানো)
   ============================================================ */

export const toCents = (amount: number) => Math.round(amount * 100);

// failed / refunded মানে এই অর্ডারের জন্য কোনো টাকা ধরা নেই
export const isVoidPayment = (status: AdminPaymentStatus) =>
  status === "failed" || status === "refunded";

// এ পর্যন্ত জমা টাকা। paidAmount ফিল্ডের আগের "paid" অর্ডার পুরো জমা ধরা হয়
export const receivedAmount = (order: {
  paymentStatus: AdminPaymentStatus;
  paidAmount?: number;
  total: number;
}): number =>
  order.paymentStatus === "paid" ? order.total : (order.paidAmount ?? 0);

// কিছু না এলে pending, পুরোটা এলে paid, মাঝামাঝি হলে partial
export const derivePaymentStatus = (
  paid: number,
  total: number,
): AdminPaymentStatus => {
  if (toCents(paid) <= 0) return "pending";
  if (toCents(paid) >= toCents(total)) return "paid";

  return "partial";
};

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

// তারিখ বাছাই (Date বা "2026-10-16" লেখা) থেকে সার্ভারের "YYYY-MM-DD"
export const toDateParam = (value: unknown): string | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  if (typeof value === "string") {
    return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : undefined;
  }

  return undefined;
};

const PAYMENT_EVENT_LABELS: Record<string, string> = {
  "payment:advance": "Advance payment received",
  "payment:paid": "Payment completed",
  "payment:partial": "Marked as partially paid",
  "payment:pending": "Marked as unpaid",
  "payment:failed": "Payment marked as failed",
  "payment:refunded": "Payment refunded",
  "payment:adjusted": "Received amount adjusted",
};

// টাইমলাইনের event-কে পড়ার মতো বাক্যে
export const describeEvent = (event: string): string => {
  if (event === "created") return "Order placed";
  if (event === "edited") return "Order edited by admin";

  if (event.startsWith("status:")) {
    const status = event.slice("status:".length) as AdminOrderStatus;
    return `Status changed to ${STATUS_LABELS[status] ?? status}`;
  }

  return PAYMENT_EVENT_LABELS[event] ?? event;
};

// react-query কী: তালিকা, summary আর একটি অর্ডারের detail
export const ORDERS_KEY = ["admin-orders"] as const;
export const ORDERS_SUMMARY_KEY = ["admin-orders-summary"] as const;
export const orderDetailKey = (id: string) => ["admin-order", id] as const;

// ব্যাকএন্ডের MAX_LINE_QUANTITY-এর সঙ্গে মেলানো
export const MAX_LINE_QUANTITY = 20;
