"use client";

import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getStatusStats, STATUSES } from "@/lib/dashboard-stats";
import type { Order } from "@/lib/mock-dashboard";
import { STATUS_META } from "./OrderStatusBadge";

const config = {
  delivered: { label: STATUS_META.delivered.label, color: "var(--chart-1)" },
  shipped: { label: STATUS_META.shipped.label, color: "var(--chart-2)" },
  processing: { label: STATUS_META.processing.label, color: "var(--chart-4)" },
  cancelled: {
    label: STATUS_META.cancelled.label,
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

export const StatusPieChart = ({ orders }: { orders: Order[] }) => {
  const stats = getStatusStats(orders);
  const data = stats.map((s) => ({ ...s, fill: `var(--color-${s.status})` }));
  const total = orders.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order status</CardTitle>
        <CardDescription>{total} orders in total</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <ChartContainer config={config} className="mx-auto h-[220px] w-full">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel nameKey="status" />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
                strokeWidth={2}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                      return null;
                    }
                    const cx = Number(viewBox.cx);
                    const cy = Number(viewBox.cy);
                    return (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={cx}
                          y={cy}
                          className="fill-foreground text-2xl font-semibold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          Orders
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}

        <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
          {STATUSES.map((status) => (
            <li key={status} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: config[status].color }}
              />
              <span className="text-muted-foreground">
                {config[status].label}
              </span>
              <span className="ml-auto font-medium tabular-nums">
                {orders.filter((o) => o.status === status).length}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
