"use client";

import * as React from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { useAdminAnalytics } from "@/hooks/use-admin-dashboard";
import { Button } from "@/components/ui/button";

import { OrdersSection } from "./OrdersSection";
import { ProductsBarChart } from "./ProductsBarChart";
import { ProfitSection } from "./ProfitSection";
import { SalesChart } from "./SalesChart";
import { StatsGrid } from "./StatsGrid";
import { StatusPieChart } from "./StatusPieChart";
import { DatePickerWithRange } from "@/components/common/DatePickerWithRange";

export const DashboardClient = () => {
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: firstDay, to: today };
  });

  // DateRange (Date objects) থেকে API-র জন্য string (YYYY-MM-DD) বানানো হচ্ছে
  const queryRange = React.useMemo(() => {
    if (!date?.from) return undefined;
    const from = format(date.from, "yyyy-MM-dd");
    const to = date.to ? format(date.to, "yyyy-MM-dd") : from;
    return { from, to };
  }, [date]);

  const analytics = useAdminAnalytics(queryRange);
  const data = analytics.data;
  const isLoading = analytics.isPending;

  // কুইক প্রিসেট ফিল্টার
  const setPreset = (days: number | "all" | "this_month") => {
    const today = new Date();
    if (days === "all") {
      setDate(undefined);
    } else if (days === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDate({ from: firstDay, to: today });
    } else {
      const past = new Date(today);
      past.setDate(today.getDate() - days);
      setDate({ from: past, to: today });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header & Date Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your orders and revenue.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-end">
          <div className="flex flex-wrap gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setPreset(0)}>
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreset(7)}>
              Last 7 Days
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreset("this_month")}
            >
              This Month
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreset("all")}
            >
              All Time
            </Button>
          </div>

          {/* শ্যাডসিএন ডেট পিকার */}
          <DatePickerWithRange date={date} setDate={setDate} />
        </div>
      </div>

      <StatsGrid
        revenue={data?.revenue ?? 0}
        totalOrders={data?.statuses.total ?? 0}
        delivered={data?.statuses.delivered ?? 0}
        inProgress={
          (data?.statuses.processing ?? 0) + (data?.statuses.shipped ?? 0)
        }
        isLoading={isLoading}
      />

      <ProfitSection range={queryRange} />

      <SalesChart daily={data?.daily ?? []} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <ProductsBarChart
          products={data?.products ?? []}
          isLoading={isLoading}
        />
        <StatusPieChart statuses={data?.statuses} isLoading={isLoading} />
      </div>

      <OrdersSection dateRange={queryRange} />
    </div>
  );
};
