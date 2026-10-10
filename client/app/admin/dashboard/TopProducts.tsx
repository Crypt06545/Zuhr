import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/mock-dashboard";

export const TopProducts = ({ orders }: { orders: Order[] }) => {
  const totals = new Map<string, { count: number; revenue: number }>();

  orders
    .filter((o) => o.status !== "cancelled")
    .forEach((o) => {
      const current = totals.get(o.product) ?? { count: 0, revenue: 0 };
      totals.set(o.product, {
        count: current.count + 1,
        revenue: current.revenue + o.amount,
      });
    });

  const products = [...totals.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = products[0]?.revenue ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>By revenue, excluding cancelled</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          products.map((p) => (
            <div key={p.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{p.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatCurrency(p.revenue)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {p.count} {p.count === 1 ? "order" : "orders"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
