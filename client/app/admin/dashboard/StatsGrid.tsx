import { CheckCircle2, Clock, ShoppingBag, Wallet } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { StatCard } from "@/lib/StatCard";

interface StatsGridProps {
  revenue: number;
  totalOrders: number;
  delivered: number;
  inProgress: number;
  isLoading?: boolean;
}

export const StatsGrid = ({
  revenue,
  totalOrders,
  delivered,
  inProgress,
  isLoading,
}: StatsGridProps) => {
  const num = (n: number) => (isLoading ? "—" : String(n));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Order value"
        value={isLoading ? "—" : formatCurrency(revenue)}
        hint="All orders except cancelled"
        icon={Wallet}
      />
      <StatCard
        title="Total orders"
        value={num(totalOrders)}
        icon={ShoppingBag}
      />
      <StatCard title="Delivered" value={num(delivered)} icon={CheckCircle2} />
      <StatCard
        title="In progress"
        value={num(inProgress)}
        hint="Processing and shipped"
        icon={Clock}
      />
    </div>
  );
};
