import { Loader2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { STATUSES } from "@/lib/dashboard-stats";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/mock-dashboard";

import { getInvoicePath } from "@/lib/routes";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { RowActions } from "./RowActions";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/api/order-options";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface OrdersManageTableProps {
  orders: Order[];
  updatingId: string | null;
  onStatusChange: (order: Order, status: OrderStatus) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}

export const OrdersManageTable = ({
  orders,
  updatingId,
  onStatusChange,
  onEdit,
  onDelete,
}: OrdersManageTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Customer</TableHead>
        <TableHead className="hidden md:table-cell">Product</TableHead>
        <TableHead className="hidden sm:table-cell">Date</TableHead>
        <TableHead className="hidden lg:table-cell">Payment</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Amount</TableHead>
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
          const isUpdating = updatingId === order.id;

          return (
            <TableRow key={order.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/15 text-xs text-accent-foreground">
                      {initials(order.customer)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="max-w-[7rem] truncate text-sm font-medium sm:max-w-none">
                      {order.customer}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.id}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {order.product}
                {order.quantity > 1 && (
                  <span className="text-muted-foreground">
                    {" "}
                    × {order.quantity}
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(order.date)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <p className="text-sm">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={order.status}
                    disabled={isUpdating}
                    onValueChange={(value) =>
                      onStatusChange(order, value as OrderStatus)
                    }
                  >
                    <SelectTrigger
                      className="h-8 w-auto gap-1.5 border-transparent bg-transparent px-1 shadow-none hover:bg-muted focus-visible:ring-2"
                      aria-label={`Change status for order ${order.id}`}
                    >
                      <OrderStatusBadge status={order.status} />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          <OrderStatusBadge status={status} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isUpdating && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(order.amount)}
              </TableCell>
              <TableCell>
                <RowActions
                  label={`order ${order.id}`}
                  invoiceHref={getInvoicePath(order.id)}
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
