"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminOrderRow } from "@/lib/api/admin-orders.api";
import { formatPrice } from "@/lib/api/Products.api";
import {
  derivePaymentStatus,
  PAYMENT_STATUS_LABELS,
  receivedAmount,
  toCents,
} from "@/lib/admin-orders";

interface OrderPaymentDialogProps {
  order: AdminOrderRow | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (paidAmount: number) => void;
}

const PaymentForm = ({
  order,
  isLoading,
  onClose,
  onConfirm,
}: Omit<OrderPaymentDialogProps, "order"> & { order: AdminOrderRow }) => {
  const received = receivedAmount(order);
  const [amount, setAmount] = useState(received > 0 ? String(received) : "");

  const value = Number(amount);
  const valid =
    amount.trim() !== "" &&
    Number.isFinite(value) &&
    value >= 0 &&
    toCents(value) <= toCents(order.total);
  const unchanged = valid && toCents(value) === toCents(received);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Record payment for {order.orderNumber}</DialogTitle>
        <DialogDescription>
          Enter the total amount received so far, including any advance.
        </DialogDescription>
      </DialogHeader>

      <dl className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Order total</dt>
          <dd className="tabular-nums">{formatPrice(order.total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Received so far</dt>
          <dd className="tabular-nums">{formatPrice(received)}</dd>
        </div>
      </dl>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="paid-amount">Total received (BDT)</Label>
          <button
            type="button"
            onClick={() => setAmount(String(order.total))}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Full amount
          </button>
        </div>
        <Input
          id="paid-amount"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={amount !== "" && !valid}
          placeholder="e.g. 500"
        />
        {amount !== "" && !valid ? (
          <p className="text-xs text-red-500">
            Enter an amount between 0 and {formatPrice(order.total)}.
          </p>
        ) : (
          valid && (
            <p className="text-xs text-muted-foreground">
              Due after this: {formatPrice(Math.max(0, order.total - value))} ·
              Status:{" "}
              {PAYMENT_STATUS_LABELS[derivePaymentStatus(value, order.total)]}
            </p>
          )
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!valid || unchanged || isLoading}
          onClick={() => onConfirm(value)}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save payment
        </Button>
      </DialogFooter>
    </>
  );
};

export const OrderPaymentDialog = ({
  order,
  isLoading,
  onClose,
  onConfirm,
}: OrderPaymentDialogProps) => (
  <Dialog
    open={order !== null}
    onOpenChange={(open) => {
      if (!open && !isLoading) onClose();
    }}
  >
    <DialogContent className="sm:max-w-md">
      {order && (
        <PaymentForm
          key={order._id}
          order={order}
          isLoading={isLoading}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      )}
    </DialogContent>
  </Dialog>
);
