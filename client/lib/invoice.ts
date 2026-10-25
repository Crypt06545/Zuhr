import type { AdminOrderDetail } from "@/lib/api/admin-orders.api";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/admin-orders";

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

// ব্যাকএন্ডের অর্ডার থেকে ইনভয়েসের তথ্য। Order shape শুধু এই ফাংশন জানে।
export const orderToInvoice = (order: AdminOrderDetail): InvoiceData => {
  const { shippingAddress: ship } = order;

  return {
    // শুরুতে "#" নেই: ইনভয়েসের হেডার নিজেই "#" বসায়
    orderId: order.orderNumber,
    createdAt: order.createdAt,
    orderStatus: STATUS_LABELS[order.status],
    paymentStatus: PAYMENT_STATUS_LABELS[order.paymentStatus],
    paymentMethod: PAYMENT_METHOD_LABELS[order.paymentMethod],
    transactionId: order.paymentTransactionId ?? null,
    customerName: ship.fullName,
    customerEmail: order.customer.email ?? null,
    customerPhone: ship.phone,
    address: [ship.addressLine, ship.city, ship.district, ship.postalCode]
      .filter(Boolean)
      .join(", "),
    items: order.items.map((item) => ({
      id: `${item.product}:${item.variant}`,
      name: item.name,
      variantLabel: [item.size, item.color].filter(Boolean).join(" / ") || null,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    discount: order.discountTotal,
    couponCode: null, // API-তে কুপন কোড ফিল্ড নেই
    shippingCharge: order.shippingFee,
    total: order.total,
  };
};
