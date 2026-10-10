import { CheckCircle2, Clock, ShoppingBag, Wallet } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/mock-dashboard";
import { StatCard } from "@/lib/StatCard";

export const StatsGrid = ({ orders }: { orders: Order[] }) => {
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.amount, 0);
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const inProgress = orders.filter(
    (o) => o.status === "processing" || o.status === "shipped",
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Revenue"
        value={formatCurrency(revenue)}
        hint="Excluding cancelled orders"
        icon={Wallet}
      />
      <StatCard
        title="Total orders"
        value={String(orders.length)}
        icon={ShoppingBag}
      />
      <StatCard
        title="Delivered"
        value={String(delivered)}
        icon={CheckCircle2}
      />
      <StatCard
        title="In progress"
        value={String(inProgress)}
        hint="Processing and shipped"
        icon={Clock}
      />
    </div>
  );
};
