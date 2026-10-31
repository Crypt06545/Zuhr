"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PaginationBar } from "@/components/common/Paginationbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCursorPagination } from "@/hooks/Usecursorpagination";
import {
  getAdminExpensesApi,
  voidExpenseApi,
  type AdminExpensesFilters,
  type ExpenseRow,
} from "@/lib/api/admin-expenses.api";
import { apiErrorMessage } from "@/lib/api/orders.api";
import { EXPENSES_KEY, FINANCE_KEY } from "@/lib/admin-expenses";

import { ExpenseFormSheet } from "./ExpenseFormSheet";
import { ExpenseVoidDialog } from "./ExpenseVoidDialog";
import { ExpensesTable } from "./ExpensesTable";
import {
  DEFAULT_EXPENSE_FILTERS,
  ExpensesToolbar,
  type ExpenseFiltersState,
} from "./ExpensesToolbar";

export const ExpensesManager = () => {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ExpenseFiltersState>(
    DEFAULT_EXPENSE_FILTERS,
  );
  const [limit, setLimit] = useState(20);

  // null = বন্ধ; { expense: null } = নতুন খরচ; { expense } = এডিট
  const [form, setForm] = useState<{ expense: ExpenseRow | null } | null>(null);
  const [voiding, setVoiding] = useState<ExpenseRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = useCursorPagination<ExpenseRow, AdminExpensesFilters>({
    queryKey: EXPENSES_KEY,
    fetcher: getAdminExpensesApi,
    filters: {
      category: filters.category === "all" ? undefined : filters.category,
      status: filters.status === "all" ? undefined : filters.status,
      dateFrom: filters.from ?? undefined,
      dateTo: filters.to ?? undefined,
    },
    limit,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
    queryClient.invalidateQueries({ queryKey: FINANCE_KEY });
  };

  const handleVoid = async (reason: string) => {
    if (!voiding || busyId) return;
    const expense = voiding;
    setBusyId(expense._id);

    try {
      await voidExpenseApi(expense._id, reason);
      toast.success(`"${expense.title}" voided.`);
      setVoiding(null);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to void the expense."));
    } finally {
      setBusyId(null);
      refresh();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>All expenses</CardTitle>
              <CardDescription>
                Page {list.page} · {list.items.length} expenses shown
              </CardDescription>
            </div>

            <Button
              type="button"
              className="h-9 gap-1.5"
              onClick={() => setForm({ expense: null })}
            >
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
          </div>

          <ExpensesToolbar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_EXPENSE_FILTERS)}
          />
        </CardHeader>

        <CardContent className="space-y-4">
          {list.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-md bg-muted/50"
                />
              ))}
            </div>
          ) : list.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {apiErrorMessage(list.error, "Failed to load expenses.")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => list.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <div
              className={
                list.isFetching ? "opacity-60 transition-opacity" : undefined
              }
            >
              <ExpensesTable
                expenses={list.items}
                busyId={busyId}
                onEdit={(expense) => setForm({ expense })}
                onVoid={setVoiding}
              />
            </div>
          )}

          <PaginationBar
            page={list.page}
            count={list.items.length}
            total={list.total}
            limit={limit}
            onLimitChange={setLimit}
            hasPrev={list.hasPrev}
            hasNext={list.hasNext}
            onPrev={list.goPrev}
            onNext={list.goNext}
          />
        </CardContent>
      </Card>

      <ExpenseFormSheet
        open={form !== null}
        expense={form?.expense ?? null}
        onClose={() => setForm(null)}
      />

      <ExpenseVoidDialog
        expense={voiding}
        isLoading={busyId !== null && busyId === voiding?._id}
        onClose={() => setVoiding(null)}
        onConfirm={handleVoid}
      />
    </>
  );
};
