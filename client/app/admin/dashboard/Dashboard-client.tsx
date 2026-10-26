"use client";

import { useAdminAnalytics } from "@/hooks/use-admin-dashboard";

import { OrdersSection } from "./OrdersSection";
import { ProductsBarChart } from "./ProductsBarChart";
import { SalesChart } from "./SalesChart";
import { StatsGrid } from "./StatsGrid";
import { StatusPieChart } from "./StatusPieChart";

export const DashboardClient = () => {
  const analytics = useAdminAnalytics();
  const data = analytics.data;
  const isLoading = analytics.isPending;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your latest orders.
        </p>
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

      <SalesChart daily={data?.daily ?? []} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <ProductsBarChart
          products={data?.products ?? []}
          isLoading={isLoading}
        />
        <StatusPieChart statuses={data?.statuses} isLoading={isLoading} />
      </div>

      <OrdersSection />
    </div>
  );
};
