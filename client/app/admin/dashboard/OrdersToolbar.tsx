"use client";

import { ArrowUpDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES } from "@/lib/dashboard-stats";
import {
  SORT_KEYS,
  SORT_LABELS,
  type OrderFilters,
  type SortKey,
} from "@/lib/order-filters";

import { DateRangePicker } from "./DateRangePicker";
import { STATUS_META } from "./OrderStatusBadge";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUSES } from "@/lib/api/order-options";

interface OrdersToolbarProps {
  filters: OrderFilters;
  onChange: (next: OrderFilters) => void;
  onReset: () => void;
  isFiltered: boolean;
}

export const OrdersToolbar = ({
  filters,
  onChange,
  onReset,
  isFiltered,
}: OrdersToolbarProps) => {
  const update = (patch: Partial<OrderFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full lg:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder="Search orders..."
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
            update({ payment: value as OrderFilters["payment"] })
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

        <Select
          value={filters.status}
          onValueChange={(value) =>
            update({ status: value as OrderFilters["status"] })
          }
        >
          <SelectTrigger
            className="w-full sm:w-[160px]"
            aria-label="Filter by order status"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_META[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) => update({ sort: value as SortKey })}
        >
          <SelectTrigger
            className="w-full justify-start gap-2 font-medium sm:w-[200px] [&>svg:last-child]:ml-auto"
            aria-label="Sort orders"
          >
            <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {SORT_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="justify-start gap-1.5 text-muted-foreground sm:col-span-2 lg:col-span-1"
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};
