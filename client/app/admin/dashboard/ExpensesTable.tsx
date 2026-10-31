"use client";

import { Ban, Pencil } from "lucide-react";

import type { ExpenseRow } from "@/lib/api/admin-expenses.api";
import { formatPrice } from "@/lib/api/Products.api";
import {
  EXPENSE_CATEGORY_LABELS,
  formatExpenseDate,
  whoName,
} from "@/lib/admin-expenses";

interface ExpensesTableProps {
  expenses: ExpenseRow[];
  busyId: string | null;
  onEdit: (expense: ExpenseRow) => void;
  onVoid: (expense: ExpenseRow) => void;
}

export const ExpensesTable = ({
  expenses,
  busyId,
  onEdit,
  onVoid,
}: ExpensesTableProps) => {
  if (expenses.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No expenses found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Expense</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
            <th className="hidden px-3 py-2 font-medium md:table-cell">
              Added by
            </th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {expenses.map((expense) => {
            const voided = expense.status === "voided";
            const busy = busyId === expense._id;

            return (
              <tr
                key={expense._id}
                className={voided ? "text-muted-foreground" : undefined}
              >
                <td className="whitespace-nowrap px-3 py-3 align-top">
                  {formatExpenseDate(expense.expenseDate)}
                </td>

                <td className="px-3 py-3 align-top">
                  <p
                    className={
                      voided ? "font-medium line-through" : "font-medium"
                    }
                  >
                    {expense.title}
                  </p>
                  {expense.note && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {expense.note}
                    </p>
                  )}
                  {voided && (
                    <p className="mt-0.5 text-xs text-red-500">
                      Voided
                      {expense.voidReason ? `: ${expense.voidReason}` : ""}
                    </p>
                  )}
                </td>

                <td className="whitespace-nowrap px-3 py-3 align-top">
                  {EXPENSE_CATEGORY_LABELS[expense.category]}
                </td>

                <td
                  className={
                    voided
                      ? "whitespace-nowrap px-3 py-3 text-right align-top tabular-nums line-through"
                      : "whitespace-nowrap px-3 py-3 text-right align-top font-medium tabular-nums"
                  }
                >
                  {formatPrice(expense.amount)}
                </td>

                <td className="hidden whitespace-nowrap px-3 py-3 align-top md:table-cell">
                  {whoName(expense.createdBy) || "—"}
                </td>

                <td className="px-3 py-3 text-right align-top">
                  {voided ? (
                    <span className="text-xs">—</span>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(expense)}
                        disabled={busy}
                        aria-label={`Edit ${expense.title}`}
                        title="Edit"
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onVoid(expense)}
                        disabled={busy}
                        aria-label={`Void ${expense.title}`}
                        title="Void"
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
