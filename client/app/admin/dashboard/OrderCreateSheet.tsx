"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
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
import { useDebouncedValue } from "@/hooks/Usecursorpagination";
import {
  createAdminOrderApi,
  type AdminPaymentMethod,
  type CreateAdminOrderBody,
} from "@/lib/api/admin-orders.api";
import { apiErrorMessage } from "@/lib/api/orders.api";
import {
  formatPrice,
  getAdminProductApi,
  getAdminProductsApi,
} from "@/lib/api/Products.api";
import {
  isMobilePayment,
  MAX_LINE_QUANTITY,
  ORDERS_KEY,
  ORDERS_SUMMARY_KEY,
  PAYMENT_METHOD_LABELS,
  toCents,
} from "@/lib/admin-orders";

const PHONE_PATTERN = /^(?:\+?88)?01[3-9]\d{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRX_PATTERN = /^[A-Za-z0-9]{8,12}$/;

// অ্যাডমিন যে তিনটি মেথডে অর্ডার বসাতে পারে (কার্ড এখনো চালু না)
const METHODS: Exclude<AdminPaymentMethod, "card">[] = [
  "cod",
  "bkash",
  "nagad",
];

type Line = {
  productId: string;
  variantId: string;
  name: string;
  option: string;
  unitPrice: number;
  stock: number;
  quantity: string;
};

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode: string;
  shippingFee: string;
  paymentMethod: Exclude<AdminPaymentMethod, "card">;
  transactionId: string;
  senderPhone: string;
  paidAmount: string;
  adminNote: string;
};

const DEFAULTS: FormValues = {
  fullName: "",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  district: "",
  postalCode: "",
  shippingFee: "",
  paymentMethod: "cod",
  transactionId: "",
  senderPhone: "",
  paidAmount: "",
  adminNote: "",
};

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

/* ============================================================
   পণ্য খোঁজা: নাম লিখে খুঁজুন, পণ্য চাপুন, ভ্যারিয়েন্ট বাছুন
   ============================================================ */

const ProductPicker = ({ onAdd }: { onAdd: (line: Line) => void }) => {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const term = useDebouncedValue(search.trim(), 300);

  const results = useQuery({
    queryKey: ["admin-order-pick", term],
    queryFn: () => getAdminProductsApi({ search: term, limit: 8 }),
    enabled: term.length >= 2,
  });

  const detail = useQuery({
    queryKey: ["admin-order-pick-detail", openId],
    queryFn: () => getAdminProductApi(openId as string),
    enabled: !!openId,
  });

  const product = detail.data;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpenId(null);
          }}
          placeholder="Search a product by name"
          aria-label="Search products"
          className="h-9 pl-9"
        />
      </div>

      {term.length >= 2 && !openId && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {results.isLoading && (
            <li className="p-3 text-sm text-muted-foreground">Searching...</li>
          )}
          {results.isError && (
            <li className="p-3 text-sm text-muted-foreground">
              {apiErrorMessage(results.error, "Could not search products.")}
            </li>
          )}
          {results.data?.items.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">
              No products found.
            </li>
          )}
          {results.data?.items.map((item) => (
            <li key={item._id}>
              <button
                type="button"
                onClick={() => setOpenId(item._id)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm hover:bg-muted"
              >
                <span className="truncate font-medium">{item.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  Stock {item.totalStock}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {openId && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          {detail.isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {detail.isError && (
            <p className="text-sm text-muted-foreground">
              {apiErrorMessage(detail.error, "Could not load this product.")}
            </p>
          )}

          {product && (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  aria-label="Back to results"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {product.status !== "active" && (
                <p className="text-xs text-red-500">
                  This product is not published, so it cannot be ordered.
                </p>
              )}

              <ul className="space-y-1.5">
                {product.variants.map((variant) => {
                  const option = [variant.size, variant.color]
                    .filter(Boolean)
                    .join(" / ");
                  const unavailable =
                    product.status !== "active" || variant.stock < 1;

                  return (
                    <li key={variant._id}>
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={() => {
                          onAdd({
                            productId: product._id,
                            variantId: variant._id,
                            name: product.name,
                            option,
                            unitPrice: variant.price,
                            stock: variant.stock,
                            quantity: "1",
                          });
                          setSearch("");
                          setOpenId(null);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>{option || "Default"}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatPrice(variant.price)} ·{" "}
                          {variant.stock < 1
                            ? "Out of stock"
                            : `Stock ${variant.stock}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   ফর্ম
   ============================================================ */

const CreateOrderForm = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();

  // এই ফর্ম খোলার সময় একবার তৈরি: দুবার চাপলেও একটাই অর্ডার হয়
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [lines, setLines] = useState<Line[]>([]);
  const [linesError, setLinesError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULTS });

  const method = watch("paymentMethod");
  const feeText = watch("shippingFee");
  const paidText = watch("paidAmount");

  const subtotal = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity);

    return Number.isInteger(quantity) && quantity > 0
      ? sum + line.unitPrice * quantity
      : sum;
  }, 0);
  const feeKnown = feeText.trim() !== "" && Number.isFinite(Number(feeText));
  const fee = feeKnown ? Number(feeText) : 0;
  const total = subtotal + fee;
  const paid = Number.isFinite(Number(paidText)) ? Number(paidText) : 0;

  const addLine = (line: Line) => {
    setLinesError("");
    setLines((current) => {
      const existing = current.find(
        (item) =>
          item.productId === line.productId &&
          item.variantId === line.variantId,
      );

      if (!existing) return [...current, line];

      return current.map((item) =>
        item === existing
          ? {
              ...item,
              quantity: String(
                Math.min(Number(item.quantity) + 1, MAX_LINE_QUANTITY),
              ),
            }
          : item,
      );
    });
  };

  const save = useMutation({
    mutationFn: (body: CreateAdminOrderBody) =>
      createAdminOrderApi(body, idempotencyKey),
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} created.`);
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: ORDERS_SUMMARY_KEY });
      onClose();
    },
    onError: (error) =>
      toast.error(apiErrorMessage(error, "Failed to create the order.")),
  });

  const onSubmit = (values: FormValues) => {
    if (lines.length === 0) {
      setLinesError("Add at least one item.");
      return;
    }

    const badLine = lines.find((line) => {
      const quantity = Number(line.quantity);

      return (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_LINE_QUANTITY ||
        quantity > line.stock
      );
    });

    if (badLine) {
      setLinesError(
        `Check the quantity of ${badLine.name}: 1 to ${Math.min(
          MAX_LINE_QUANTITY,
          badLine.stock,
        )}.`,
      );
      return;
    }

    const paidNow =
      values.paidAmount.trim() === "" ? 0 : Number(values.paidAmount);

    if (feeKnown && toCents(paidNow) > toCents(total)) {
      setError("paidAmount", { message: "More than the order total" });
      return;
    }

    const body: CreateAdminOrderBody = {
      items: lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: Number(line.quantity),
      })),
      shippingAddress: {
        fullName: values.fullName.trim(),
        phone: values.phone.replace(/[\s-]/g, ""),
        addressLine: values.addressLine.trim(),
        city: values.city.trim(),
        ...(values.district.trim() && { district: values.district.trim() }),
        ...(values.postalCode.trim() && {
          postalCode: values.postalCode.trim(),
        }),
      },
      ...(values.email.trim() && { customerEmail: values.email.trim() }),
      paymentMethod: values.paymentMethod,
      ...(feeKnown && { shippingFee: Number(values.shippingFee) }),
      ...(isMobilePayment(values.paymentMethod) &&
        values.transactionId.trim() && {
          paymentTransactionId: values.transactionId.trim(),
        }),
      ...(isMobilePayment(values.paymentMethod) &&
        values.senderPhone.trim() && {
          paymentSenderPhone: values.senderPhone.replace(/[\s-]/g, ""),
        }),
      ...(paidNow > 0 && { paidAmount: paidNow }),
      ...(values.adminNote.trim() && { adminNote: values.adminNote.trim() }),
    };

    save.mutate(body);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-8 overflow-y-auto px-6 pb-8">
        {/* কাস্টমার */}
        <section className="space-y-4">
          <SectionTitle>Customer</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="c-fullName"
              label="Full name"
              error={errors.fullName?.message}
            >
              <Input
                id="c-fullName"
                aria-invalid={!!errors.fullName}
                {...register("fullName", { required: "Name is required" })}
              />
            </Field>
            <Field id="c-phone" label="Phone" error={errors.phone?.message}>
              <Input
                id="c-phone"
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
              id="c-email"
              label="Email (optional)"
              error={errors.email?.message}
              className="sm:col-span-2"
            >
              <Input
                id="c-email"
                type="email"
                aria-invalid={!!errors.email}
                {...register("email", {
                  validate: (value) =>
                    value.trim() === "" ||
                    EMAIL_PATTERN.test(value.trim()) ||
                    "Enter a valid email",
                })}
              />
            </Field>
          </div>
        </section>

        {/* ঠিকানা */}
        <section className="space-y-4">
          <SectionTitle>Delivery address</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="c-address"
              label="Address"
              error={errors.addressLine?.message}
              className="sm:col-span-2"
            >
              <Input
                id="c-address"
                aria-invalid={!!errors.addressLine}
                {...register("addressLine", {
                  required: "Address is required",
                })}
              />
            </Field>
            <Field id="c-city" label="City" error={errors.city?.message}>
              <Input
                id="c-city"
                aria-invalid={!!errors.city}
                {...register("city", { required: "City is required" })}
              />
            </Field>
            <Field id="c-district" label="District">
              <Input id="c-district" {...register("district")} />
            </Field>
            <Field id="c-postal" label="Postal code">
              <Input id="c-postal" {...register("postalCode")} />
            </Field>
          </div>
        </section>

        {/* আইটেম */}
        <section className="space-y-3">
          <SectionTitle>Items</SectionTitle>
          <ProductPicker onAdd={addLine} />

          {lines.length > 0 && (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {lines.map((line, index) => (
                <li
                  key={`${line.productId}:${line.variantId}`}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[line.option, formatPrice(line.unitPrice)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={Math.min(MAX_LINE_QUANTITY, line.stock)}
                    aria-label={`Quantity of ${line.name}`}
                    className="h-9 w-20"
                    value={line.quantity}
                    onChange={(e) => {
                      setLinesError("");
                      setLines((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, quantity: e.target.value }
                            : item,
                        ),
                      );
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLines((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    aria-label={`Remove ${line.name}`}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <FieldError message={linesError} />
        </section>

        {/* চার্জ ও পেমেন্ট */}
        <section className="space-y-4">
          <SectionTitle>Charges and payment</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="c-fee"
              label="Delivery charge (BDT)"
              error={errors.shippingFee?.message}
            >
              <Input
                id="c-fee"
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Blank = normal charge"
                aria-invalid={!!errors.shippingFee}
                {...register("shippingFee", {
                  validate: (value) =>
                    value.trim() === "" ||
                    (Number.isFinite(Number(value)) && Number(value) >= 0) ||
                    "Enter a valid amount",
                })}
              />
            </Field>

            <Field id="c-method" label="Payment method">
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="c-method" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {PAYMENT_METHOD_LABELS[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {isMobilePayment(method) && (
              <>
                <Field
                  id="c-trx"
                  label="Transaction ID (optional)"
                  error={errors.transactionId?.message}
                >
                  <Input
                    id="c-trx"
                    aria-invalid={!!errors.transactionId}
                    {...register("transactionId", {
                      validate: (value) =>
                        value.trim() === "" ||
                        TRX_PATTERN.test(value.trim()) ||
                        "8-12 letters or numbers",
                    })}
                  />
                </Field>
                <Field
                  id="c-sender"
                  label="Paid from (optional)"
                  error={errors.senderPhone?.message}
                >
                  <Input
                    id="c-sender"
                    type="tel"
                    inputMode="tel"
                    aria-invalid={!!errors.senderPhone}
                    {...register("senderPhone", {
                      validate: (value) =>
                        value.trim() === "" ||
                        PHONE_PATTERN.test(value.replace(/[\s-]/g, "")) ||
                        "Enter a valid mobile number",
                    })}
                  />
                </Field>
              </>
            )}

            <Field
              id="c-paid"
              label="Received amount (BDT)"
              error={errors.paidAmount?.message}
              className="sm:col-span-2"
            >
              <Input
                id="c-paid"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="Advance or full payment received now (blank = nothing yet)"
                aria-invalid={!!errors.paidAmount}
                {...register("paidAmount", {
                  validate: (value) =>
                    value.trim() === "" ||
                    (Number.isFinite(Number(value)) && Number(value) >= 0) ||
                    "Enter a valid amount",
                })}
              />
            </Field>
          </div>

          <dl className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">
                {feeKnown
                  ? formatPrice(fee)
                  : "Normal charge (added by server)"}
              </dd>
            </div>
            {feeKnown && (
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(total)}</dd>
              </div>
            )}
            {feeKnown && paid > 0 && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Received</dt>
                  <dd className="tabular-nums">-{formatPrice(paid)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Due</dt>
                  <dd className="tabular-nums">
                    {formatPrice(Math.max(0, total - paid))}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </section>

        {/* অ্যাডমিন নোট */}
        <section className="space-y-4">
          <SectionTitle>Internal note</SectionTitle>
          <Field id="c-note" label="Only admins can see this">
            <Textarea
              id="c-note"
              rows={3}
              maxLength={500}
              placeholder="e.g. Ordered by phone, wants delivery after 5 PM"
              {...register("adminNote")}
            />
          </Field>
        </section>
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
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create order"
          )}
        </Button>
      </div>
    </form>
  );
};

/* ============================================================
   সাইডবার
   ============================================================ */

interface OrderCreateSheetProps {
  open: boolean;
  onClose: () => void;
}

export const OrderCreateSheet = ({ open, onClose }: OrderCreateSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={(next) => {
      if (!next) onClose();
    }}
  >
    <SheetContent
      side="right"
      className="w-full gap-0 p-0 will-change-transform sm:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
    >
      <SheetHeader className="px-6 pb-4 pt-6 text-left">
        <SheetTitle>Create order</SheetTitle>
        <SheetDescription>
          Enter an order for a customer. It is saved under your name, and the
          stock is reduced like a normal checkout.
        </SheetDescription>
      </SheetHeader>

      <CreateOrderForm onClose={onClose} />
    </SheetContent>
  </Sheet>
);
