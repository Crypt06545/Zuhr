import type { Order, OrderStatus, PaymentStatus } from "@/lib/mock-dashboard";

export type SortKey = "newest" | "oldest" | "amount_desc" | "amount_asc";

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  amount_desc: "Amount: high to low",
  amount_asc: "Amount: low to high",
};

export const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];

export interface OrderFilters {
  query: string;
  status: "all" | OrderStatus;
  payment: "all" | PaymentStatus;
  from: string | null; // YYYY-MM-DD
  to: string | null; // YYYY-MM-DD
  sort: SortKey;
}

export const DEFAULT_FILTERS: OrderFilters = {
  query: "",
  status: "all",
  payment: "all",
  from: null,
  to: null,
  sort: "newest",
};

export const hasActiveFilters = (f: OrderFilters) =>
  f.query.trim() !== "" ||
  f.status !== "all" ||
  f.payment !== "all" ||
  f.from !== null;

export const applyOrderFilters = (
  orders: Order[],
  filters: OrderFilters,
): Order[] => {
  const q = filters.query.trim().toLowerCase();
  // A single picked day (no end date) filters to exactly that day
  const lo = filters.from;
  const hi = filters.to ?? filters.from;

  return orders
    .filter((o) => {
      // Compare date-only strings so timezones can never shift a day
      const day = o.date.slice(0, 10);

      const matchesStatus =
        filters.status === "all" || o.status === filters.status;
      const matchesPayment =
        filters.payment === "all" || o.paymentStatus === filters.payment;
      const matchesDate = !lo || (day >= lo && day <= (hi ?? lo));
      const matchesQuery =
        !q ||
        o.customer.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q);

      return matchesStatus && matchesPayment && matchesDate && matchesQuery;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case "oldest":
          return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
        case "amount_desc":
          return b.amount - a.amount;
        case "amount_asc":
          return a.amount - b.amount;
        default:
          return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
      }
    });
};
