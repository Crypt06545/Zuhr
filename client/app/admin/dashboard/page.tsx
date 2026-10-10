
import { getOrders } from "@/lib/mock-dashboard";
import { StatsGrid } from "./StatsGrid";
import { SalesChart } from "./SalesChart";
import { ProductsBarChart } from "./ProductsBarChart";
import { StatusPieChart } from "./StatusPieChart";
import { OrdersSection } from "./OrdersSection";

const DashboardPage = async () => {
  const orders = await getOrders();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your latest orders.
        </p>
      </div>

      <StatsGrid orders={orders} />

      <SalesChart orders={orders} />

      <div className="grid gap-4 lg:grid-cols-3">
        <ProductsBarChart orders={orders} />
        <StatusPieChart orders={orders} />
      </div>

      <OrdersSection orders={orders} />
    </div>
  );
};

export default DashboardPage;
