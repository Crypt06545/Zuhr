// lib/api/admin-analytics.api.ts
import { API } from "@/lib/axios";
import type { OrderSummaryCounts } from "./admin-orders.api";

export interface AnalyticsDailyPoint {
  date: string; // "2026-10-01"
  revenue: number;
  orders: number;
}

export interface AnalyticsProductPoint {
  sku: string;
  name: string;
  size: string;
  color?: string;
  revenue: number;
  orders: number;
}

export interface AdminAnalytics {
  from: string;
  to: string;
  revenue: number;
  orders: number;
  daily: AnalyticsDailyPoint[];
  products: AnalyticsProductPoint[];
  statuses: OrderSummaryCounts;
}

export interface AnalyticsRange {
  from?: string;
  to?: string;
}

const unwrap = <T>(res: { data: unknown }): T => {
  const body = res.data as { data?: unknown };
  return (body?.data ?? body) as T;
};

export const getAdminAnalyticsApi = (
  params?: AnalyticsRange,
): Promise<AdminAnalytics> =>
  API.get("/orders/admin/analytics", { params }).then((res) =>
    unwrap<AdminAnalytics>(res),
  );
