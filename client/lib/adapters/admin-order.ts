import type {
  AdminOrderItem,
  AdminOrderRow,
  AdminOrderStatus,
} from "@/lib/api/admin-orders.api";

export interface DashboardOrder {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  amount: number;
  date: string;
  status: AdminOrderStatus;
}

const productLabel = (items: AdminOrderItem[]): string => {
  if (!items.length) return "—";

  const first = items[0];
  const base = [first.name, first.size].filter(Boolean).join(" ");

  // কোয়ান্টিটি ১ এর বেশি হলে সেটা দেখাবে
  const qty = first.quantity > 1 ? ` (x${first.quantity})` : "";

  return items.length === 1
    ? `${base}${qty}`
    : `${base}${qty} +${items.length - 1} more`;
};

export const toDashboardOrder = (row: AdminOrderRow): DashboardOrder => ({
  id: row.orderNumber,
  orderId: row._id,
  customer: row.customer.name,
  product: productLabel(row.items),
  amount: row.total,
  date: row.createdAt,
  status: row.status,
});

export const DASHBOARD_STATUSES: AdminOrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
