"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { FieldError } from "@/components/common/FieldError";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import type { Order, PaymentMethod, PaymentStatus } from "@/lib/mock-dashboard";

import { OrderStatusBadge } from "./OrderStatusBadge";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS, PAYMENT_STATUSES } from "@/lib/api/order-options";

interface FormState {
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  product: string;
  quantity: string;
  amount: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note: string;
}

type Errors = Partial<
  Record<
    | "customer"
    | "email"
    | "phone"
    | "address"
    | "city"
    | "product"
    | "quantity"
    | "amount",
    string
  >
>;

const toForm = (order: Order): FormState => ({
  customer: order.customer,
  email: order.email,
  phone: order.phone,
  address: order.address,
  city: order.city,
  product: order.product,
  quantity: String(order.quantity),
  amount: String(order.amount),
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  note: order.note,
});

const PHONE_PATTERN = /^(?:\+?88)?01[3-9]\d{8}$/;

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
    {children}
  </p>
);

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

const Field = ({ id, label, error, className, children }: FieldProps) => (
  <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
    <Label htmlFor={id}>{label}</Label>
    {children}
    <FieldError message={error} />
  </div>
);

interface OrderFormProps {
  order: Order;
  onSave: (order: Order) => Promise<void>;
  onCancel: () => void;
}

const OrderForm = ({ order, onSave, onCancel }: OrderFormProps) => {
  const [form, setForm] = useState<FormState>(() => toForm(order));
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    const next: Errors = {};
    const quantityNum = Number(form.quantity);
    const amountNum = Number(form.amount);

    if (!form.customer.trim()) next.customer = "Customer name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (!PHONE_PATTERN.test(form.phone.replace(/[\s-]/g, ""))) {
      next.phone = "Enter a valid Bangladeshi mobile number";
    }
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.city.trim()) next.city = "City is required";
    if (!form.product.trim()) next.product = "Product is required";
    if (
      form.quantity.trim() === "" ||
      !Number.isInteger(quantityNum) ||
      quantityNum < 1
    ) {
      next.quantity = "Minimum 1";
    }
    if (
      form.amount.trim() === "" ||
      !Number.isFinite(amountNum) ||
      amountNum < 0
    ) {
      next.amount = "Enter a valid amount";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);
    try {
      await onSave({
        ...order,
        customer: form.customer.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/[\s-]/g, ""),
        address: form.address.trim(),
        city: form.city.trim(),
        product: form.product.trim(),
        quantity: quantityNum,
        amount: amountNum,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus,
        note: form.note.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <section className="space-y-4">
        <SectionTitle>Customer</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="order-customer" label="Full name" error={errors.customer}>
            <Input
              id="order-customer"
              value={form.customer}
              onChange={(e) => set("customer", e.target.value)}
              aria-invalid={!!errors.customer}
            />
          </Field>
          <Field id="order-phone" label="Phone" error={errors.phone}>
            <Input
              id="order-phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={!!errors.phone}
            />
          </Field>
          <Field
            id="order-email"
            label="Email"
            error={errors.email}
            className="sm:col-span-2"
          >
            <Input
              id="order-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={!!errors.email}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Shipping</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="order-address"
            label="Address"
            error={errors.address}
            className="sm:col-span-2"
          >
            <Input
              id="order-address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              aria-invalid={!!errors.address}
            />
          </Field>
          <Field id="order-city" label="City" error={errors.city}>
            <Input
              id="order-city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              aria-invalid={!!errors.city}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Order</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="order-product"
            label="Product"
            error={errors.product}
            className="sm:col-span-3"
          >
            <Input
              id="order-product"
              value={form.product}
              onChange={(e) => set("product", e.target.value)}
              aria-invalid={!!errors.product}
            />
          </Field>
          <Field id="order-quantity" label="Quantity" error={errors.quantity}>
            <Input
              id="order-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              aria-invalid={!!errors.quantity}
            />
          </Field>
          <Field
            id="order-amount"
            label="Total (BDT)"
            error={errors.amount}
            className="sm:col-span-2"
          >
            <Input
              id="order-amount"
              type="number"
              inputMode="decimal"
              min={0}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              aria-invalid={!!errors.amount}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Payment</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="order-payment-method" label="Method">
            <Select
              value={form.paymentMethod}
              onValueChange={(value) =>
                set("paymentMethod", value as PaymentMethod)
              }
            >
              <SelectTrigger id="order-payment-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="order-payment-status" label="Payment status">
            <Select
              value={form.paymentStatus}
              onValueChange={(value) =>
                set("paymentStatus", value as PaymentStatus)
              }
            >
              <SelectTrigger id="order-payment-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Notes</SectionTitle>
        <Field id="order-note" label="Internal note">
          <Textarea
            id="order-note"
            rows={3}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Delivery instructions, gift message..."
          />
        </Field>
      </section>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface OrderEditDialogProps {
  order: Order | null;
  onClose: () => void;
  onSave: (order: Order) => Promise<void>;
}

export const OrderEditDialog = ({
  order,
  onClose,
  onSave,
}: OrderEditDialogProps) => (
  <Dialog
    open={order !== null}
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  >
    <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-3">
          Edit order {order?.id}
          {order && <OrderStatusBadge status={order.status} />}
        </DialogTitle>
        <DialogDescription>
          {order
            ? `Placed on ${formatDate(order.date)}. Use the status dropdown in the table to change its status.`
            : ""}
        </DialogDescription>
      </DialogHeader>
      {order && (
        <OrderForm
          key={order.id}
          order={order}
          onSave={onSave}
          onCancel={onClose}
        />
      )}
    </DialogContent>
  </Dialog>
);
