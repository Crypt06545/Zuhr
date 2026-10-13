import type { PaymentMethod, PaymentStatus } from "@/lib/mock-dashboard";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  refunded: "Refunded",
};

export const PAYMENT_METHODS = Object.keys(
  PAYMENT_METHOD_LABELS,
) as PaymentMethod[];

export const PAYMENT_STATUSES = Object.keys(
  PAYMENT_STATUS_LABELS,
) as PaymentStatus[];
