"use client";

import { PiggyBank, Banknote, Receipt, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminFinance } from "@/hooks/use-admin-finance";
import type { FinanceRange } from "@/lib/api/admin-finance.api";
import { apiErrorMessage } from "@/lib/api/orders.api";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/admin-expenses";
import { formatCurrency } from "@/lib/format";
import { StatCard } from "@/lib/StatCard";

interface ProfitSectionProps {
  range?: FinanceRange;
}

export const ProfitSection = ({ range }: ProfitSectionProps) => {
  const finance = useAdminFinance(range);
  const data = finance.data;
  const isLoading = !!range && finance.isPending;

  const money = (value?: number) =>
    isLoading || value === undefined ? "—" : formatCurrency(value);

  const expenseEntries =
    data?.expensesByCategory.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Profit & Loss</h2>
        <p className="text-sm text-muted-foreground">
          Delivered orders only, counted on the day they were delivered. Voided
          expenses are ignored.
        </p>
      </div>

      {!range ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Pick a date range (up to 1 year) to see profit. &quot;All Time&quot;
            is not available here.
          </CardContent>
        </Card>
      ) : finance.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {apiErrorMessage(
                finance.error,
                "Failed to load the profit report.",
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => finance.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            finance.isFetching && !isLoading
              ? "space-y-4 opacity-60 transition-opacity"
              : "space-y-4"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Net profit"
              value={money(data?.netProfit)}
              hint={
                data
                  ? `Includes ${formatCurrency(data.deliveryCharge)} delivery charge`
                  : undefined
              }
              icon={TrendingUp}
            />
            <StatCard
              title="Product revenue"
              value={money(data?.productRevenue)}
              hint={data ? `${data.orders} delivered orders` : undefined}
              icon={Banknote}
            />
            <StatCard
              title="Gross profit"
              value={money(data?.grossProfit)}
              hint={
                data
                  ? `After product cost ${formatCurrency(data.cogs)}`
                  : undefined
              }
              icon={PiggyBank}
            />
            <StatCard
              title="Expenses"
              value={money(data?.expenses)}
              hint={data ? `${expenseEntries} entries` : undefined}
              icon={Receipt}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Where did the money go?</CardTitle>
              <CardDescription>Expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 animate-pulse rounded-md bg-muted/50"
                    />
                  ))}
                </div>
              ) : !data || data.expensesByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No expenses in this range.
                </p>
              ) : (
                <ul className="space-y-4">
                  {data.expensesByCategory.map((row) => {
                    const percent =
                      data.expenses > 0
                        ? (row.amount / data.expenses) * 100
                        : 0;

                    return (
                      <li key={row.category} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">
                            {EXPENSE_CATEGORY_LABELS[row.category]}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatCurrency(row.amount)} · {percent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
};
