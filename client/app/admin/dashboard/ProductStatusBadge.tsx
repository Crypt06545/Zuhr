import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StockState = "in_stock" | "low_stock" | "out_of_stock";

// Stock at or below this number counts as "Low stock"
export const LOW_STOCK_THRESHOLD = 10;

export const STOCK_STATE_META: Record<
  StockState,
  { label: string; className: string; dot: string }
> = {
  in_stock: {
    label: "In stock",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    dot: "bg-emerald-500",
  },
  low_stock: {
    label: "Low stock",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    dot: "bg-amber-500",
  },
  out_of_stock: {
    label: "Out of stock",
    className:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
    dot: "bg-red-500",
  },
};

export const getStockState = (stock: number): StockState => {
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
};

export const StockBadge = ({ state }: { state: StockState }) => {
  const { label, className, dot } = STOCK_STATE_META[state];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
};
