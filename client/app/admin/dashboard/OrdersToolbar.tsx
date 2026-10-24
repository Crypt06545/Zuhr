"use client";

import type { ComponentProps } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdminOrderStatus,
  AdminPaymentStatus,
  OrderSummaryCounts,
} from "@/lib/api/admin-orders.api";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/admin-orders";

import { DateRangePicker } from "./DateRangePicker";

type DateValue = ComponentProps<typeof DateRangePicker>["from"];

export type OrderFiltersState = {
  query: string;
  status: AdminOrderStatus | "all";
  payment: AdminPaymentStatus | "all";
  from: DateValue;
  to: DateValue;
};

export const DEFAULT_ORDER_FILTERS: OrderFiltersState = {
  query: "",
  status: "all",
  payment: "all",
  from: null,
  to: null,
};

export const hasActiveOrderFilters = (filters: OrderFiltersState) =>
  filters.query.trim() !== "" ||
  filters.status !== "all" ||
  filters.payment !== "all" ||
  !!filters.from ||
  !!filters.to;

interface OrdersToolbarProps {
  filters: OrderFiltersState;
  counts?: OrderSummaryCounts;
  onChange: (next: OrderFiltersState) => void;
  onReset: () => void;
}

export const OrdersToolbar = ({
  filters,
  counts,
  onChange,
  onReset,
}: OrdersToolbarProps) => {
  const update = (patch: Partial<OrderFiltersState>) =>
    onChange({ ...filters, ...patch });

  const chip = (
    value: AdminOrderStatus | "all",
    label: string,
    count?: number,
  ) => (
    <Button
      key={value}
      type="button"
      size="sm"
      variant={filters.status === value ? "default" : "outline"}
      onClick={() => update({ status: value })}
      aria-pressed={filters.status === value}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
      )}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* অবস্থা অনুযায়ী ফিল্টার, সঙ্গে সংখ্যা (ব্যাকএন্ডের summary থেকে) */}
      <div className="flex flex-wrap gap-2">
        {chip("all", "All", counts?.total)}
        {ORDER_STATUSES.map((status) =>
          chip(status, STATUS_LABELS[status], counts?.[status]),
        )}
      </div>

      <div className="relative w-full lg:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder="Order no., phone, email or transaction ID"
          aria-label="Search orders"
          className="h-9 pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <DateRangePicker
          from={filters.from}
          to={filters.to}
          onChange={(from, to) => update({ from, to })}
        />

        <Select
          value={filters.payment}
          onValueChange={(value) =>
            update({ payment: value as OrderFiltersState["payment"] })
          }
        >
          <SelectTrigger
            className="w-full sm:w-[160px]"
            aria-label="Filter by payment"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {PAYMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!hasActiveOrderFilters(filters)}
          className="justify-start gap-1.5 text-muted-foreground"
        >
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      </div>
    </div>
  );
};
