import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Order, OrderStatus } from "@/lib/mock-dashboard";
import { STATUS_META } from "./OrderStatusBadge";

const STATUSES = Object.keys(STATUS_META) as OrderStatus[];

export const StatusBreakdown = ({ orders }: { orders: Order[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Order status</CardTitle>
      <CardDescription>{orders.length} orders in total</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {STATUSES.map((status) => {
        const count = orders.filter((o) => o.status === status).length;
        const percent = orders.length ? (count / orders.length) * 100 : 0;

        return (
          <div key={status} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{STATUS_META[status].label}</span>
              <span className="tabular-nums text-muted-foreground">
                {count}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  status === "cancelled" ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);
