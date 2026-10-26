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
import type { AnalyticsProductPoint } from "@/lib/api/admin-analytics.api";
import { formatCurrency } from "@/lib/format";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface ProductsBarChartProps {
  products: AnalyticsProductPoint[];
  isLoading?: boolean;
}

export const ProductsBarChart = ({
  products,
  isLoading,
}: ProductsBarChartProps) => {
  const data = products.map((p) => ({
    product: [p.name, p.size].filter(Boolean).join(" "),
    revenue: p.revenue,
  }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>
          Revenue by product, excluding cancelled
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : data.length === 0 ? (
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
