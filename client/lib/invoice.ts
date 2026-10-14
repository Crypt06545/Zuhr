
import { STATUS_META } from "@/app/admin/dashboard/OrderStatusBadge";
import type { Order } from "@/lib/mock-dashboard";

import { toPublicOrderId } from "@/lib/routes";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "./api/order-options";

export interface InvoiceItem {
  id: string;
  name: string;
  variantLabel: string | null;
  quantity: number;
  price: number; // unit price
}

export interface InvoiceData {
  orderId: string;
  createdAt: string;
  orderStatus: string; // display label
  paymentStatus: string; // display label
  paymentMethod: string;
  transactionId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  address: string;
  items: InvoiceItem[];
  discount: number;
  couponCode: string | null;
  shippingCharge: number;
  total: number;
}

// The only place that knows the Order shape. The mock order has no unit price,
// shipping, discount or transaction fields, so they default here.
// When your real API provides them, map them in this function and nothing else changes.
export const orderToInvoice = (order: Order): InvoiceData => {
  const quantity = Math.max(order.quantity, 1);

  return {
    // No leading "#": the invoice header already prints one before the number
    orderId: toPublicOrderId(order.id),
    createdAt: order.date,
    orderStatus: STATUS_META[order.status].label,
    paymentStatus: PAYMENT_STATUS_LABELS[order.paymentStatus],
    paymentMethod: PAYMENT_METHOD_LABELS[order.paymentMethod],
    transactionId: null,
    customerName: order.customer,
    customerEmail: order.email,
    customerPhone: order.phone,
    address: [order.address, order.city].filter(Boolean).join(", "),
    items: [
      {
        id: order.id,
        name: order.product,
        variantLabel: null,
        quantity,
        price: order.amount / quantity,
      },
    ],
    discount: 0,
    couponCode: null,
    shippingCharge: 0,
    total: order.amount,
  };
};
