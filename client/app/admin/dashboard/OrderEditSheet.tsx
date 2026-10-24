"use client";

import type { ReactNode } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { FieldError } from "@/components/common/FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminOrderApi,
  updateOrderApi,
  type AdminOrderDetail,
  type AdminPaymentStatus,
  type UpdateOrderBody,
} from "@/lib/api/admin-orders.api";
import { apiErrorMessage } from "@/lib/api/orders.api";
import { formatPrice } from "@/lib/api/Products.api";

import { OrderStatusBadge } from "./OrderStatusBadge";
import {
  derivePaymentStatus,
  describeEvent,
  formatDateTime,
  isVoidPayment,
  MAX_LINE_QUANTITY,
  orderDetailKey,
  ORDERS_KEY,
  ORDERS_SUMMARY_KEY,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
  receivedAmount,
  toCents,
} from "@/lib/admin-orders";

const PHONE_PATTERN = /^(?:\+?88)?01[3-9]\d{8}$/;

type LineValues = {
  productId: string;
  variantId: string;
  name: string;
  option: string;
  unitPrice: number;
  quantity: string;
};

type FormValues = {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode: string;
  shippingFee: string;
  paymentStatus: AdminPaymentStatus;
  paidAmount: string;
  adminNote: string;
  items: LineValues[];
};

const toValues = (order: AdminOrderDetail): FormValues => ({
  fullName: order.shippingAddress.fullName,
  phone: order.shippingAddress.phone,
  addressLine: order.shippingAddress.addressLine,
  city: order.shippingAddress.city,
  district: order.shippingAddress.district ?? "",
  postalCode: order.shippingAddress.postalCode ?? "",
  shippingFee: String(order.shippingFee),
  paymentStatus: order.paymentStatus,
  paidAmount: String(receivedAmount(order)),
  adminNote: order.adminNote ?? "",
  items: order.items.map((item) => ({
    productId: String(item.product),
    variantId: String(item.variant),
    name: item.name,
    option: [item.size, item.color].filter(Boolean).join(" / "),
    unitPrice: item.unitPrice,
    quantity: String(item.quantity),
  })),
});

const lineKey = (productId: string, variantId: string) =>
  `${productId}:${variantId}`;

/* ============================================================
   ছোট অংশ
   ============================================================ */

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
    {children}
  </p>
);

const Field = ({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
    <Label htmlFor={id}>{label}</Label>
    {children}
    <FieldError message={error} />
  </div>
);

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="break-words text-sm font-medium">{children}</dd>
  </div>
);

/* ============================================================
   ফর্ম
   ============================================================ */

const OrderForm = ({
  order,
  onClose,
}: {
  order: AdminOrderDetail;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: toValues(order) });

  const { fields, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" });
  const watchedFee = useWatch({ control, name: "shippingFee" });
  const watchedPaid = useWatch({ control, name: "paidAmount" });

  // দেখানোর জন্য মোট (আসল হিসাব সার্ভার করে)
  const subtotal = (watchedItems ?? []).reduce((sum, line) => {
    const quantity = Number(line.quantity);

    return Number.isInteger(quantity) && quantity > 0
      ? sum + line.unitPrice * quantity
      : sum;
  }, 0);
  const fee = Number.isFinite(Number(watchedFee)) ? Number(watchedFee) : 0;
  const total = Math.max(0, subtotal - order.discountTotal + fee);

  const paidNumber = Number(watchedPaid);
  const received =
    watchedPaid?.trim() !== "" && Number.isFinite(paidNumber) && paidNumber > 0
      ? paidNumber
      : 0;
  const due = Math.max(0, total - received);

  const save = useMutation({
    mutationFn: (body: UpdateOrderBody) => updateOrderApi(order._id, body),
    onSuccess: () => {
      toast.success(`Order ${order.orderNumber} updated.`);
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ORDERS_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: orderDetailKey(order._id) });
      onClose();
    },
    onError: (error) =>
      toast.error(apiErrorMessage(error, "Failed to update the order.")),
  });

  const onSubmit = (values: FormValues) => {
    const body: UpdateOrderBody = { expectedUpdatedAt: order.updatedAt };
    let changed = false;

    // আইটেম: কোনো লাইন বাদ গেলে বা পরিমাণ বদলালে তবেই পাঠাই
    const original = new Map(
      order.items.map((item) => [
        lineKey(String(item.product), String(item.variant)),
        item.quantity,
      ]),
    );
    const itemsChanged =
      values.items.length !== original.size ||
      values.items.some(
        (line) =>
          original.get(lineKey(line.productId, line.variantId)) !==
          Number(line.quantity),
      );

    if (itemsChanged) {
      body.items = values.items.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: Number(line.quantity),
      }));
      changed = true;
    }

    // ঠিকানা
    const address = {
      fullName: values.fullName.trim(),
      phone: values.phone.replace(/[\s-]/g, ""),
      addressLine: values.addressLine.trim(),
      city: values.city.trim(),
      district: values.district.trim(),
      postalCode: values.postalCode.trim(),
    };
    const before = order.shippingAddress;
    const addressChanged =
      address.fullName !== before.fullName ||
      address.phone !== before.phone ||
      address.addressLine !== before.addressLine ||
      address.city !== before.city ||
      address.district !== (before.district ?? "") ||
      address.postalCode !== (before.postalCode ?? "");

    if (addressChanged) {
      body.shippingAddress = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine: address.addressLine,
        city: address.city,
        ...(address.district && { district: address.district }),
        ...(address.postalCode && { postalCode: address.postalCode }),
      };
      changed = true;
    }

    if (Number(values.shippingFee) !== order.shippingFee) {
      body.shippingFee = Number(values.shippingFee);
      changed = true;
    }

    // পেমেন্ট: টাকার অঙ্ক বদলালে অঙ্কই সিদ্ধান্ত নেয় (সার্ভার স্ট্যাটাস ঠিক করে);
    // অঙ্ক একই থেকে শুধু স্ট্যাটাস বদলালে স্ট্যাটাস পাঠাই
    const paidNow = Number(values.paidAmount);

    if (values.paymentStatus === "partial") {
      if (toCents(paidNow) <= 0 || toCents(paidNow) >= toCents(total)) {
        setError("paidAmount", {
          message: "For a partial payment, enter less than the order total",
        });
        return;
      }
    }

    if (toCents(paidNow) !== toCents(receivedAmount(order))) {
      body.paidAmount = paidNow;
      if (isVoidPayment(values.paymentStatus)) {
        body.paymentStatus = values.paymentStatus;
      }
      changed = true;
    } else if (values.paymentStatus !== order.paymentStatus) {
      body.paymentStatus = values.paymentStatus;
      changed = true;
    }

    if (values.adminNote.trim() !== (order.adminNote ?? "").trim()) {
      body.adminNote = values.adminNote.trim();
      changed = true;
    }

    if (!changed) {
      toast.info("Nothing to save.");
      return;
    }

    save.mutate(body);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-8 overflow-y-auto px-6 pb-8">
        {/* শুধু পড়ার তথ্য */}
        <section className="space-y-3">
          <SectionTitle>Customer and payment</SectionTitle>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label="Customer">{order.customer.name}</Fact>
            <Fact label="Account email">{order.customer.email}</Fact>
            <Fact label="Payment method">
              {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            </Fact>
            {order.paymentTransactionId && (
              <Fact label="Transaction ID">
                <span className="font-mono">{order.paymentTransactionId}</span>
              </Fact>
            )}
            {order.paymentSenderPhone && (
              <Fact label="Paid from">{order.paymentSenderPhone}</Fact>
            )}
            {order.note && <Fact label="Customer note">{order.note}</Fact>}
          </dl>
        </section>

        {/* আইটেম */}
        <section className="space-y-3">
          <SectionTitle>Items</SectionTitle>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {fields.map((field, index) => (
              <li key={field.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{field.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[field.option, formatPrice(field.unitPrice)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {errors.items?.[index]?.quantity?.message && (
                    <FieldError
                      message={errors.items[index]?.quantity?.message}
                    />
                  )}
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_LINE_QUANTITY}
                  aria-label={`Quantity of ${field.name}`}
                  className="h-9 w-20"
                  {...register(`items.${index}.quantity`, {
                    validate: (value) => {
                      const quantity = Number(value);

                      return (
                        (Number.isInteger(quantity) &&
                          quantity >= 1 &&
                          quantity <= MAX_LINE_QUANTITY) ||
                        `1 to ${MAX_LINE_QUANTITY}`
                      );
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  aria-label={`Remove ${field.name}`}
                  title={
                    fields.length <= 1
                      ? "An order needs at least one item"
                      : "Remove item"
                  }
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Changing a quantity or removing an item adjusts the stock for you.
          </p>
        </section>

        {/* ঠিকানা */}
        <section className="space-y-4">
          <SectionTitle>Delivery address</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="o-fullName"
              label="Full name"
              error={errors.fullName?.message}
            >
              <Input
                id="o-fullName"
                aria-invalid={!!errors.fullName}
                {...register("fullName", { required: "Name is required" })}
              />
            </Field>
            <Field id="o-phone" label="Phone" error={errors.phone?.message}>
              <Input
                id="o-phone"
                type="tel"
                inputMode="tel"
                aria-invalid={!!errors.phone}
                {...register("phone", {
                  validate: (value) =>
                    PHONE_PATTERN.test(value.replace(/[\s-]/g, "")) ||
                    "Enter a valid Bangladeshi mobile number",
                })}
              />
            </Field>
            <Field
              id="o-address"
              label="Address"
              error={errors.addressLine?.message}
              className="sm:col-span-2"
            >
              <Input
                id="o-address"
                aria-invalid={!!errors.addressLine}
                {...register("addressLine", {
                  required: "Address is required",
                })}
              />
            </Field>
            <Field id="o-city" label="City" error={errors.city?.message}>
              <Input
                id="o-city"
                aria-invalid={!!errors.city}
                {...register("city", { required: "City is required" })}
              />
            </Field>
            <Field id="o-district" label="District">
              <Input id="o-district" {...register("district")} />
            </Field>
            <Field id="o-postal" label="Postal code">
              <Input id="o-postal" {...register("postalCode")} />
            </Field>
          </div>
        </section>

        {/* টাকা ও পেমেন্ট */}
        <section className="space-y-4">
          <SectionTitle>Charges and payment</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="o-fee"
              label="Delivery charge (BDT)"
              error={errors.shippingFee?.message}
            >
              <Input
                id="o-fee"
                type="number"
                inputMode="decimal"
                min={0}
                aria-invalid={!!errors.shippingFee}
                {...register("shippingFee", {
                  validate: (value) =>
                    (value.trim() !== "" &&
                      Number.isFinite(Number(value)) &&
                      Number(value) >= 0) ||
                    "Enter a valid amount",
                })}
              />
            </Field>

            <Field id="o-payment-status" label="Payment status">
              <Controller
                name="paymentStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      const next = value as AdminPaymentStatus;
                      field.onChange(next);

                      // স্ট্যাটাস আর জমা টাকা সবসময় মিলে থাকে
                      if (next === "paid") {
                        setValue("paidAmount", String(total), {
                          shouldDirty: true,
                        });
                      } else if (next !== "partial") {
                        setValue("paidAmount", "0", { shouldDirty: true });
                      }
                    }}
                  >
                    <SelectTrigger id="o-payment-status" className="w-full">
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
                )}
              />
            </Field>

            <Field
              id="o-paid"
              label="Received amount (BDT)"
              error={errors.paidAmount?.message}
              className="sm:col-span-2"
            >
              <Input
                id="o-paid"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="Advance or full payment received so far"
                aria-invalid={!!errors.paidAmount}
                {...register("paidAmount", {
                  validate: (value) => {
                    const amount = Number(value);

                    if (
                      value.trim() === "" ||
                      !Number.isFinite(amount) ||
                      amount < 0
                    ) {
                      return "Enter a valid amount";
                    }

                    return (
                      toCents(amount) <= toCents(total) ||
                      "More than the order total"
                    );
                  },
                  onChange: (event) => {
                    const amount = Number(event.target.value);
                    const current = getValues("paymentStatus");

                    const next: AdminPaymentStatus =
                      !Number.isFinite(amount) || amount <= 0
                        ? isVoidPayment(current)
                          ? current
                          : "pending"
                        : derivePaymentStatus(amount, total);

                    setValue("paymentStatus", next, { shouldDirty: true });
                  },
                })}
              />
            </Field>
          </div>

          <dl className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums">
                  -{formatPrice(order.discountTotal)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">{formatPrice(fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(total)}</dd>
            </div>
            {received > 0 && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Received</dt>
                  <dd className="tabular-nums">-{formatPrice(received)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Due</dt>
                  <dd className="tabular-nums">{formatPrice(due)}</dd>
                </div>
              </>
            )}
          </dl>
        </section>

        {/* অ্যাডমিন নোট */}
        <section className="space-y-4">
          <SectionTitle>Internal note</SectionTitle>
          <Field id="o-note" label="Only admins can see this">
            <Textarea
              id="o-note"
              rows={3}
              maxLength={500}
              placeholder="Payment checked, courier details..."
              {...register("adminNote")}
            />
          </Field>
        </section>

        {/* ইতিহাস */}
        {order.timeline.length > 0 && (
          <section className="space-y-3">
            <SectionTitle>History</SectionTitle>
            <ol className="space-y-3 border-l border-border pl-4">
              {[...order.timeline].reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary"
                  />
                  <p className="text-sm font-medium">
                    {describeEvent(entry.event)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.at)}
                  </p>
                  {entry.note && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={save.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!isDirty || save.isPending}>
          {save.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
};

/* ============================================================
   সাইডবার: খোলার সময় সার্ভার থেকে সর্বশেষ তথ্য আনে (timeline সহ)
   ============================================================ */

interface OrderEditSheetProps {
  orderId: string | null;
  onClose: () => void;
}

export const OrderEditSheet = ({ orderId, onClose }: OrderEditSheetProps) => {
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: orderDetailKey(orderId ?? ""),
    queryFn: () => getAdminOrderApi(orderId as string),
    enabled: !!orderId,
    gcTime: 0, // প্রতিবার খুললে নতুন তথ্য (পুরনো updatedAt দিয়ে সেভ করা ঠেকায়)
  });

  return (
    <Sheet
      open={orderId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 will-change-transform sm:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="px-6 pb-4 pt-6 text-left">
          <SheetTitle className="flex flex-wrap items-center gap-3">
            {order ? `Order ${order.orderNumber}` : "Order"}
            {order && <OrderStatusBadge status={order.status} />}
          </SheetTitle>
          <SheetDescription>
            {order
              ? `Placed on ${formatDateTime(order.createdAt)}. Use the status menu in the table to change its status.`
              : "Loading the latest details..."}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="space-y-3 px-6">
            <div className="h-24 animate-pulse rounded-lg bg-muted/50" />
            <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {apiErrorMessage(error, "Could not load this order.")}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {order && (
          <OrderForm
            key={`${order._id}-${order.updatedAt}`}
            order={order}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
