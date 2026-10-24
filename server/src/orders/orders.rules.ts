// src/orders/orders.rules.ts

import { OrderStatus, PaymentStatus } from './schemas/order.schema.js';

// Which status an order may move to from its current one
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

// The statuses an order can be in right before it moves to `target`
export const statusesThatCanMoveTo = (target: OrderStatus): OrderStatus[] =>
  (Object.entries(STATUS_TRANSITIONS) as [OrderStatus, OrderStatus[]][])
    .filter(([, targets]) => targets.includes(target))
    .map(([from]) => from);

// Items, address and fees can change only before the parcel is shipped
export const EDITABLE_STATUSES = [OrderStatus.PENDING, OrderStatus.PROCESSING];

export const ADMIN_CANCELLABLE = [OrderStatus.PENDING, OrderStatus.PROCESSING];

// A customer can cancel only while nobody has started working on the order
export const CUSTOMER_CANCELLABLE = [OrderStatus.PENDING];

const cents = (amount: number) => Math.round(amount * 100);

// Nothing received = pending, everything received = paid, in between = partial
export const derivePaymentStatus = (
  paidAmount: number,
  total: number,
): PaymentStatus => {
  if (cents(paidAmount) <= 0) return PaymentStatus.PENDING;
  if (cents(paidAmount) >= cents(total)) return PaymentStatus.PAID;

  return PaymentStatus.PARTIAL;
};

// Money received so far. Orders saved before `paidAmount` existed count as
// fully received when they are marked paid.
export const receivedAmount = (order: {
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  total: number;
}): number =>
  order.paymentStatus === PaymentStatus.PAID
    ? order.total
    : (order.paidAmount ?? 0);
