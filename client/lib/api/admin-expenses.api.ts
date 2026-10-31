// lib/api/admin-expenses.api.ts
// অ্যাডমিনের খরচ API (ব্যাকএন্ডে AdminOnly গার্ড আছে)
import type { CursorPage } from "@/hooks/Usecursorpagination";
import { API } from "@/lib/axios";

export type ExpenseCategory =
  | "advertising"
  | "courier"
  | "packaging"
  | "salary"
  | "rent"
  | "utilities"
  | "gateway_fees"
  | "software"
  | "stock_loss"
  | "other";

export type ExpenseStatus = "active" | "voided";

// তালিকা/detail API নামসহ অবজেক্ট দেয়; তৈরির রেসপন্সে শুধু আইডি স্ট্রিং
type Who = { _id: string; name?: string } | string | null;

export type ExpenseRow = {
  _id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  // বাংলাদেশের ওই দিনের শুরু (UTC-তে আগের দিনের 18:00)
  expenseDate: string;
  note?: string;
  status: ExpenseStatus;
  createdBy?: Who;
  updatedBy?: Who;
  voidedAt?: string;
  voidedBy?: Who;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminExpensesFilters = {
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  dateFrom?: string; // "2026-10-01"
  dateTo?: string; // "2026-10-31" (ওই দিনও ধরা হয়)
};

export type CreateExpenseBody = {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string; // "2026-10-31"
  note?: string;
};

export type UpdateExpenseBody = Partial<CreateExpenseBody> & {
  // অন্য কেউ এর মধ্যে বদলালে সার্ভার 409 দেয়
  expectedUpdatedAt?: string;
};

// ব্যাকএন্ড { success, data } দেয়; data না থাকলে পুরো body-ই ধরি
const unwrap = <T>(res: { data: unknown }): T => {
  const body = res.data as { data?: unknown };
  return (body?.data ?? body) as T;
};

export const getAdminExpensesApi = (
  params: AdminExpensesFilters & { limit?: number; cursor?: string },
): Promise<CursorPage<ExpenseRow>> =>
  API.get("/expenses", { params }).then((res) =>
    unwrap<CursorPage<ExpenseRow>>(res),
  );

export const createExpenseApi = (body: CreateExpenseBody) =>
  API.post("/expenses", body).then((res) => unwrap<ExpenseRow>(res));

export const updateExpenseApi = (id: string, body: UpdateExpenseBody) =>
  API.patch(`/expenses/${encodeURIComponent(id)}`, body).then((res) =>
    unwrap<ExpenseRow>(res),
  );

// মুছে ফেলার কোনো API নেই; ভুল এন্ট্রি শুধু void করা যায়
export const voidExpenseApi = (id: string, reason: string) =>
  API.patch(`/expenses/${encodeURIComponent(id)}/void`, { reason }).then(
    (res) => unwrap<ExpenseRow>(res),
  );
