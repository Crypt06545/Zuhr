"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import { getProductStats } from "@/lib/dashboard-stats";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/mock-dashboard";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const ProductsBarChart = ({ orders }: { orders: Order[] }) => {
  const data = getProductStats(orders);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>
          Revenue by product, excluding cancelled
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <ChartContainer config={config} className="h-[240px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 12 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="product"
                type="category"
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <XAxis type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
