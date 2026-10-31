// lib/admin-expenses.ts
import type { ExpenseCategory, ExpenseRow } from "@/lib/api/admin-expenses.api";

export const EXPENSES_KEY = ["admin-expenses"] as const;

// খরচ বদলালে লাভ-ক্ষতির রিপোর্টও বদলায়, তাই এটাও refresh হয়
// (ড্যাশবোর্ডের finance query এই key-তে বসবে)
export const FINANCE_KEY = ["admin-finance"] as const;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "advertising",
  "courier",
  "packaging",
  "salary",
  "rent",
  "utilities",
  "gateway_fees",
  "software",
  "stock_loss",
  "other",
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  advertising: "Advertising",
  courier: "Courier",
  packaging: "Packaging",
  salary: "Salary",
  rent: "Rent",
  utilities: "Utilities",
  gateway_fees: "Gateway fees",
  software: "Software",
  stock_loss: "Stock loss",
  other: "Other",
};

// বাংলাদেশের দিন "2026-10-31" (ব্রাউজারের টাইমজোন যা-ই হোক)
export const bdDateKey = (value?: string | Date): string =>
  new Date(value ?? Date.now()).toLocaleDateString("en-CA", {
    timeZone: "Asia/Dhaka",
  });

export const formatExpenseDate = (value: string): string =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });

export const whoName = (value: ExpenseRow["createdBy"]): string =>
  typeof value === "object" && value ? (value.name ?? "") : "";
