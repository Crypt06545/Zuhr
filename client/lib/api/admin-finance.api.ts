// lib/api/admin-finance.api.ts
// লাভ-ক্ষতির রিপোর্ট (ব্যাকএন্ডে AdminOnly গার্ড আছে)
import { API } from "@/lib/axios";

import type { ExpenseCategory } from "./admin-expenses.api";

export interface FinanceRange {
  from: string; // "2026-10-01"
  to: string; // "2026-10-31" (ওই দিনও ধরা হয়)
}

export interface FinanceDailyPoint {
  date: string;
  orders: number;
  productRevenue: number;
  cogs: number;
  grossProfit: number;
}

export interface FinanceExpensePoint {
  category: ExpenseCategory;
  amount: number;
  count: number;
}

export interface AdminFinanceSummary {
  from: string;
  to: string;
  orders: number; // রেঞ্জে Delivered অর্ডার
  productRevenue: number; // subtotal − discount
  deliveryCharge: number; // কাস্টমারের কাছ থেকে নেওয়া ডেলিভারি চার্জ
  cogs: number; // বিক্রি হওয়া পণ্যের কেনা দাম
  grossProfit: number; // productRevenue − cogs
  expenses: number; // শুধু active খরচ (void বাদ)
  netProfit: number; // grossProfit + deliveryCharge − expenses
  expensesByCategory: FinanceExpensePoint[];
  daily: FinanceDailyPoint[];
}

const unwrap = <T>(res: { data: unknown }): T => {
  const body = res.data as { data?: unknown };
  return (body?.data ?? body) as T;
};

export const getAdminFinanceApi = (
  params: FinanceRange,
): Promise<AdminFinanceSummary> =>
  API.get("/finance/summary", { params }).then((res) =>
    unwrap<AdminFinanceSummary>(res),
  );
