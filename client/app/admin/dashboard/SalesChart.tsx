"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
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
import type { AnalyticsDailyPoint } from "@/lib/api/admin-analytics.api";
import { formatCurrency, formatDate } from "@/lib/format";

type Metric = "revenue" | "orders";
type Variant = "area" | "bar";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en", { notation: "compact" });

interface ToggleProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function Toggle<T extends string>({
  value,
  options,
  onChange,
}: ToggleProps<T>) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="h-7 px-3"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

interface SalesChartProps {
  daily: AnalyticsDailyPoint[];
  isLoading?: boolean;
}

export const SalesChart = ({ daily, isLoading }: SalesChartProps) => {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [variant, setVariant] = useState<Variant>("area");

  const color = `var(--color-${metric})`;

  const tooltip = (
    <ChartTooltipContent
      labelFormatter={(label) => formatDate(String(label))}
      formatter={(value) => (
        <div className="flex w-full items-center justify-between gap-4">
          <span className="text-muted-foreground">{config[metric].label}</span>
          <span className="font-medium tabular-nums">
            {metric === "revenue"
              ? formatCurrency(Number(value))
              : String(value)}
          </span>
        </div>
      )}
    />
  );

  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        tickFormatter={(value) => formatDate(String(value))}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={44}
        allowDecimals={false}
        tickFormatter={(value) => compact.format(Number(value))}
      />
      <ChartTooltip content={tooltip} />
    </>
  );

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Sales overview</CardTitle>
          <CardDescription>Daily, excluding cancelled orders</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Toggle
            value={metric}
            onChange={setMetric}
            options={[
              { value: "revenue", label: "Revenue" },
              { value: "orders", label: "Orders" },
            ]}
          />
          <Toggle
            value={variant}
            onChange={setVariant}
            options={[
              { value: "area", label: "Area" },
              { value: "bar", label: "Bar" },
            ]}
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : daily.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <ChartContainer config={config} className="h-[280px] w-full">
            {variant === "area" ? (
              <AreaChart data={daily} margin={{ left: 4, right: 12, top: 8 }}>
                {axes}
                <Area
                  dataKey={metric}
                  type="monotone"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <BarChart data={daily} margin={{ left: 4, right: 12, top: 8 }}>
                {axes}
                <Bar dataKey={metric} fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
