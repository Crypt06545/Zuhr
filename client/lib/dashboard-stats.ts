import type { Order, OrderStatus } from "@/lib/mock-dashboard";

export const STATUSES: OrderStatus[] = [
  "delivered",
  "shipped",
  "processing",
  "cancelled",
];

// Revenue and product charts exclude cancelled orders
const active = (orders: Order[]) =>
  orders.filter((o) => o.status !== "cancelled");

export interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

export const getDailyStats = (orders: Order[]): DailyPoint[] => {
  const map = new Map<string, DailyPoint>();

  active(orders).forEach((o) => {
    const current = map.get(o.date) ?? { date: o.date, revenue: 0, orders: 0 };
    current.revenue += o.amount;
    current.orders += 1;
    map.set(o.date, current);
  });

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
};

export interface ProductPoint {
  product: string;
  revenue: number;
  orders: number;
}

export const getProductStats = (orders: Order[]): ProductPoint[] => {
  const map = new Map<string, ProductPoint>();

  active(orders).forEach((o) => {
    const current = map.get(o.product) ?? {
      product: o.product,
      revenue: 0,
      orders: 0,
    };
    current.revenue += o.amount;
    current.orders += 1;
    map.set(o.product, current);
  });

  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
};

export interface StatusPoint {
  status: OrderStatus;
  count: number;
}

export const getStatusStats = (orders: Order[]): StatusPoint[] =>
  STATUSES.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  })).filter((s) => s.count > 0);
