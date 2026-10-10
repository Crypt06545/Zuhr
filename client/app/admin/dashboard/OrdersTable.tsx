import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order } from "@/lib/mock-dashboard";
import { OrderStatusBadge } from "./OrderStatusBadge";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const OrdersTable = ({ orders }: { orders: Order[] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Customer</TableHead>
        <TableHead className="hidden md:table-cell">Product</TableHead>
        <TableHead className="hidden sm:table-cell">Date</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {orders.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={5}
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
                  <p className="truncate text-sm font-medium">
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
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatCurrency(order.amount)}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);
