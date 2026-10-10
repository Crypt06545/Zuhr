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
import { OrderStatusBadge } from "./OrderStatusBadge";
import { RowActions } from "./RowActions";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface OrdersManageTableProps {
  orders: Order[];
  onStatusChange: (id: string, status: OrderStatus) => void;
  onDelete: (order: Order) => void;
}

export const OrdersManageTable = ({
  orders,
  onStatusChange,
  onDelete,
}: OrdersManageTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Customer</TableHead>
        <TableHead className="hidden md:table-cell">Product</TableHead>
        <TableHead className="hidden sm:table-cell">Date</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Amount</TableHead>
        <TableHead className="w-12">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {orders.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={6}
            className="h-24 text-center text-muted-foreground"
          >
            No orders found.
          </TableCell>
        </TableRow>
      ) : (
        orders.map((order) => (
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
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {formatDate(order.date)}
            </TableCell>
            <TableCell>
              <Select
                value={order.status}
                onValueChange={(value) =>
                  onStatusChange(order.id, value as OrderStatus)
                }
              >
                <SelectTrigger
                  className="h-8 w-[132px]"
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
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatCurrency(order.amount)}
            </TableCell>
            <TableCell>
              <RowActions
                label={`Actions for order ${order.id}`}
                onDelete={() => onDelete(order)}
              />
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);
