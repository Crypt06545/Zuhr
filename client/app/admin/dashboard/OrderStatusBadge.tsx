import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/mock-dashboard";

export const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  delivered: { label: "Delivered", variant: "default" },
  shipped: { label: "Shipped", variant: "secondary" },
  processing: { label: "Processing", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const { label, variant } = STATUS_META[status];
  return <Badge variant={variant}>{label}</Badge>;
};
