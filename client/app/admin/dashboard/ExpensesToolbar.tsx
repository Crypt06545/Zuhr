"use client";

import type { ComponentProps } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ExpenseCategory,
  ExpenseStatus,
} from "@/lib/api/admin-expenses.api";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/admin-expenses";

import { DateRangePicker } from "./DateRangePicker";

type DateValue = ComponentProps<typeof DateRangePicker>["from"];

export type ExpenseFiltersState = {
  category: ExpenseCategory | "all";
  status: ExpenseStatus | "all";
  from: DateValue;
  to: DateValue;
};

export const DEFAULT_EXPENSE_FILTERS: ExpenseFiltersState = {
  category: "all",
  status: "all",
  from: null,
  to: null,
};

export const hasActiveExpenseFilters = (filters: ExpenseFiltersState) =>
  filters.category !== "all" ||
  filters.status !== "all" ||
  !!filters.from ||
  !!filters.to;

interface ExpensesToolbarProps {
  filters: ExpenseFiltersState;
  onChange: (next: ExpenseFiltersState) => void;
  onReset: () => void;
}

export const ExpensesToolbar = ({
  filters,
  onChange,
  onReset,
}: ExpensesToolbarProps) => {
  const update = (patch: Partial<ExpenseFiltersState>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
      <DateRangePicker
        from={filters.from}
        to={filters.to}
        onChange={(from, to) => update({ from, to })}
      />

      <Select
        value={filters.category}
        onValueChange={(value) =>
          update({ category: value as ExpenseFiltersState["category"] })
        }
      >
        <SelectTrigger
          className="w-full sm:w-[170px]"
          aria-label="Filter by category"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {EXPENSE_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {EXPENSE_CATEGORY_LABELS[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) =>
          update({ status: value as ExpenseFiltersState["status"] })
        }
      >
        <SelectTrigger
          className="w-full sm:w-[150px]"
          aria-label="Filter by status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="voided">Voided</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={!hasActiveExpenseFilters(filters)}
        className="justify-start gap-1.5 text-muted-foreground"
      >
        <X className="h-4 w-4" />
        Clear filters
      </Button>
    </div>
  );
};
