import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminOrderStatus } from "@/lib/api/admin-orders.api";

export const STATUS_META: Record<
  AdminOrderStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20",
    dot: "bg-slate-500",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    dot: "bg-emerald-500",
  },
  shipped: {
    label: "Shipped",
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
    dot: "bg-blue-500",
  },
  processing: {
    label: "Processing",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    dot: "bg-amber-500",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
    dot: "bg-red-500",
  },
};

export const OrderStatusBadge = ({ status }: { status: AdminOrderStatus }) => {
  const { label, className, dot } = STATUS_META[status];

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
