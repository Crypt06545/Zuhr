import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminOrderRow,
  AdminOrderStatus,
  AdminPaymentStatus,
} from "@/lib/api/admin-orders.api";
import { formatPrice } from "@/lib/api/Products.api";
import {
  formatDateTime,
  ORDER_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  receivedAmount,
} from "@/lib/admin-orders";
import { getInvoicePath } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { OrderStatusBadge } from "./OrderStatusBadge";
import { RowActions } from "./RowActions";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

// Status ব্যাজের মতো একই আকার ও ডট; রঙ আসে PAYMENT_STATUS_STYLES থেকে
const PaymentBadge = ({ status }: { status: AdminPaymentStatus }) => (
  <Badge
    variant="outline"
    className={cn(
      "gap-1.5 rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium",
      PAYMENT_STATUS_STYLES[status],
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {PAYMENT_STATUS_LABELS[status]}
  </Badge>
);

// প্রথম আইটেমের নাম + "আরও N টি"
const itemsLabel = (order: AdminOrderRow) => {
  const [first] = order.items;
  if (!first) return "—";

  const more = order.items.length - 1;

  return (
    <>
      {first.name}
      {first.quantity > 1 && (
        <span className="text-muted-foreground"> × {first.quantity}</span>
      )}
      {more > 0 && (
        <span className="block text-xs text-muted-foreground">
          +{more} more {more === 1 ? "item" : "items"}
        </span>
      )}
    </>
  );
};

interface OrdersManageTableProps {
  orders: AdminOrderRow[];
  busyId: string | null; // যে অর্ডারের ওপর এখন কাজ চলছে
  onStatusChange: (order: AdminOrderRow, status: AdminOrderStatus) => void;
  onPaymentChange: (
    order: AdminOrderRow,
    paymentStatus: AdminPaymentStatus,
  ) => void;
  onRecordPayment: (order: AdminOrderRow) => void;
  onEdit: (order: AdminOrderRow) => void;
  onDelete: (order: AdminOrderRow) => void;
}

export const OrdersManageTable = ({
  orders,
  busyId,
  onStatusChange,
  onPaymentChange,
  onRecordPayment,
  onEdit,
  onDelete,
}: OrdersManageTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Order</TableHead>
        <TableHead>Customer</TableHead>
        <TableHead className="hidden lg:table-cell">Items</TableHead>
        <TableHead className="hidden md:table-cell">Payment</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Total</TableHead>
        <TableHead className="w-32">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {orders.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={7}
            className="h-24 text-center text-muted-foreground"
          >
            No orders found.
          </TableCell>
        </TableRow>
      ) : (
        orders.map((order) => {
          const busy = busyId === order._id;
          const received = receivedAmount(order);

          return (
            <TableRow key={order._id}>
              <TableCell>
                <p className="font-mono text-[13px] font-semibold">
                  {order.orderNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </p>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-accent-foreground sm:flex"
                  >
                    {initials(order.customer.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="max-w-[8rem] truncate text-sm font-medium sm:max-w-[12rem]">
                      {order.customer.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.customer.phone}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                {itemsLabel(order)}
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <p className="text-sm">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </p>
                <Select
                  value={order.paymentStatus}
                  disabled={busy || order.status === "cancelled"}
                  onValueChange={(value) =>
                    onPaymentChange(order, value as AdminPaymentStatus)
                  }
                >
                  <SelectTrigger
                    className="-ml-1 h-8 w-auto gap-1.5 border-transparent bg-transparent px-1 shadow-none hover:bg-muted focus-visible:ring-2"
                    aria-label={`Change payment status for order ${order.orderNumber}`}
                  >
                    <PaymentBadge status={order.paymentStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        <PaymentBadge status={status} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {order.paymentStatus === "partial" && (
                  <button
                    type="button"
                    onClick={() => onRecordPayment(order)}
                    disabled={busy || order.status === "cancelled"}
                    className="block text-[11px] tabular-nums text-muted-foreground hover:text-foreground hover:underline disabled:pointer-events-none"
                  >
                    Paid {formatPrice(received)} · Due{" "}
                    {formatPrice(Math.max(0, order.total - received))}
                  </button>
                )}
                {order.paymentTransactionId && (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {order.paymentTransactionId}
                  </p>
                )}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={order.status}
                    disabled={busy}
                    onValueChange={(value) =>
                      onStatusChange(order, value as AdminOrderStatus)
                    }
                  >
                    <SelectTrigger
                      className="h-8 w-auto gap-1.5 border-transparent bg-transparent px-1 shadow-none hover:bg-muted focus-visible:ring-2"
                      aria-label={`Change status for order ${order.orderNumber}`}
                    >
                      <OrderStatusBadge status={order.status} />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          <OrderStatusBadge status={status} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {busy && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </TableCell>

              <TableCell className="text-right font-medium tabular-nums">
                {formatPrice(order.total)}
              </TableCell>

              <TableCell>
                <RowActions
                  label={`order ${order.orderNumber}`}
                  invoiceHref={getInvoicePath(order._id)}
                  onEdit={() => onEdit(order)}
                  onDelete={() => onDelete(order)}
                />
              </TableCell>
            </TableRow>
          );
        })
      )}
    </TableBody>
  </Table>
);
