"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Hash,
  Search,
  Truck,
  Clock,
  PackageCheck,
  Home,
  XCircle,
  MapPin,
  RotateCcw,
  CircleAlert,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  Package,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  Wallet,
} from "lucide-react";

import type { AdminOrderStatus } from "@/lib/api/admin-orders.api";
import { trackOrderApi, type TrackedOrder } from "@/lib/api/track-order.api";
import { apiErrorMessage } from "@/lib/api/orders.api";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  STATUS_LABELS,
} from "@/lib/admin-orders";
import { cn } from "@/lib/utils";

/* ============================================================
   TYPES
   ============================================================ */

type TrackOrderFormData = { orderId: string };

/* ============================================================
   CONFIG
   ============================================================ */

const STAGES = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "processing", label: "Processing", icon: PackageCheck },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
] as const;

const STATUS_BADGE_STYLES: Record<AdminOrderStatus, string> = {
  pending:
    "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
  processing:
    "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

// স্ট্যাটাস অনুযায়ী এক লাইনের বার্তা
const STATUS_MESSAGES: Record<AdminOrderStatus, string> = {
  pending: "We have received your order and will confirm it shortly.",
  processing: "Your order is being prepared for dispatch.",
  shipped: "Your order is on its way to you.",
  delivered: "Your order has been delivered. Thank you for shopping with us!",
  cancelled: "This order was cancelled.",
};

const taka = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;

// অনেকবার চেষ্টা করলে (429) সুন্দর বার্তা, নইলে সার্ভারের বার্তা
const trackErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  return apiErrorMessage(error, "Order not found. Please check your Order ID.");
};

/* ============================================================
   PAGE
   ============================================================ */

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const initialRunRef = useRef(false);

  const trackOrder = async (rawId: string) => {
    const trimmed = rawId.replace(/\s+/g, "");
    if (!trimmed) return;

    setSubmitError(null);
    setIsLoading(true);
    setActiveId(trimmed);

    try {
      setOrder(await trackOrderApi(trimmed));
    } catch (error) {
      setOrder(null);
      setSubmitError(trackErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialRunRef.current) return;
    initialRunRef.current = true;

    if (idFromUrl) trackOrder(idFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFromUrl]);

  const handleReset = () => {
    setOrder(null);
    setSubmitError(null);
    setActiveId(null);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      window.history.replaceState(null, "", url.toString());
    }
  };

  const showResult = Boolean(order);

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-background px-4 py-12 lg:py-20">
      <div className="w-full max-w-4xl animate-fade-in">
        {isLoading ? (
          <LoadingState id={activeId} />
        ) : showResult && order ? (
          <OrderResult order={order} onReset={handleReset} />
        ) : (
          <TrackOrderForm
            onSubmit={(data) => trackOrder(data.orderId)}
            isSubmitting={isLoading}
            submitError={submitError}
            prefillId={idFromUrl || ""}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TRACK ORDER FORM
   ============================================================ */

type FormProps = {
  onSubmit: (data: TrackOrderFormData) => void;
  isSubmitting: boolean;
  submitError: string | null;
  prefillId: string;
};

function TrackOrderForm({
  onSubmit,
  isSubmitting,
  submitError,
  prefillId,
}: FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackOrderFormData>({
    defaultValues: { orderId: prefillId },
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="grid md:grid-cols-2">
        {/* ============ FORM SIDE ============ */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 p-8 md:p-10"
          noValidate
        >
          {/* Heading */}
          <div className="flex flex-col gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Truck
                size={20}
                strokeWidth={1.9}
                className="text-primary"
                aria-hidden="true"
              />
            </span>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Track Your Order
              </h1>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                Enter your Order ID or scan the QR code from your invoice.
              </p>
            </div>
          </div>

          {/* Order ID field */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="orderId"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Order ID
            </Label>
            <div className="relative">
              <Hash
                size={16}
                strokeWidth={1.9}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="orderId"
                placeholder="ORD-261023-XXXXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={!!errors.orderId}
                className="h-12 rounded-lg border-border bg-background pl-10 font-mono text-[14px] uppercase tracking-wide placeholder:normal-case focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                {...register("orderId", {
                  required: "Enter your Order ID",
                  minLength: {
                    value: 4,
                    message: "Enter a valid Order ID",
                  },
                })}
              />
            </div>
            {errors.orderId && (
              <p
                role="alert"
                className="text-[11.5px] font-medium text-destructive"
              >
                {errors.orderId.message}
              </p>
            )}
          </div>

          {/* QR hint */}
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <QrCode
              size={16}
              strokeWidth={1.9}
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Scanned from invoice?
              </span>{" "}
              Your Order ID is auto-filled — just hit Track.
            </p>
          </div>

          {submitError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5"
            >
              <CircleAlert
                size={15}
                strokeWidth={2}
                className="shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-[12.5px] font-medium text-destructive">
                {submitError}
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={16}
                  strokeWidth={2.2}
                  className="animate-spin"
                  aria-hidden="true"
                />
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">
                  Searching...
                </span>
              </>
            ) : (
              <>
                <Search
                  size={16}
                  strokeWidth={2.2}
                  className="transition-transform group-hover:scale-110"
                  aria-hidden="true"
                />
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">
                  Track Order
                </span>
              </>
            )}
          </button>

          <Separator />

          <p className="text-center text-[12.5px] text-muted-foreground">
            Can&apos;t find your order?{" "}
            <Link
              href="/contact"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Contact support
            </Link>
          </p>
        </form>

        {/* ============ ILLUSTRATION SIDE ============ */}
        <div className="relative hidden overflow-hidden bg-foreground md:flex md:flex-col">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
          />

          <div className="relative flex flex-1 items-center justify-center">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
              />
              <Truck
                size={112}
                strokeWidth={1.2}
                className="relative text-background"
                aria-hidden="true"
              />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-transparent"
          />

          <div className="absolute bottom-8 left-8 right-8 flex items-start gap-3 text-background">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <ShieldCheck
                size={16}
                strokeWidth={1.9}
                className="text-primary"
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold">Real-Time Tracking</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-background/70">
                Know exactly where your order is, every step of the way.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE LOADER
   ============================================================ */

function PageLoader() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2
          size={22}
          strokeWidth={2}
          className="animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-[12.5px] text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/* ============================================================
   LOADING STATE (ফলাফলের আকৃতির স্কেলিটন)
   ============================================================ */

function LoadingState({ id }: { id: string | null }) {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-5 w-52 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
        </div>
        {id && (
          <p className="mt-4 flex items-center gap-2 font-mono text-[11.5px] text-muted-foreground">
            <Loader2
              size={12}
              strokeWidth={2.2}
              className="animate-spin text-primary"
              aria-hidden="true"
            />
            Looking up {id}...
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5">
              <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="h-64 animate-pulse rounded-2xl bg-muted/60 md:col-span-3" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/60 md:col-span-2" />
      </div>
    </div>
  );
}

/* ============================================================
   COPY BUTTON
   ============================================================ */

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Order ID copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy. Please copy it manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy order ID"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {copied ? (
        <Check size={13} strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <Copy size={13} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}

/* ============================================================
   ORDER RESULT
   ============================================================ */

type OrderResultProps = { order: TrackedOrder; onReset: () => void };

function OrderResult({ order, onReset }: OrderResultProps) {
  const location =
    [order.city, order.district].filter(Boolean).join(", ") || "—";
  const partlyPaid = order.paymentStatus === "partial" && order.paidAmount > 0;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="animate-fade-in overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div aria-hidden="true" className="h-1.5 w-full bg-primary" />

        <div className="p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Order ID
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[18px] font-bold tracking-wide text-foreground">
                  {order.orderNumber}
                </span>
                <CopyButton value={order.orderNumber} />
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-BD", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Dhaka",
                })}{" "}
                · {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${STATUS_BADGE_STYLES[order.status]}`}
              >
                {order.status === "delivered" && (
                  <CheckCircle2
                    size={12}
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                )}
                {order.status === "cancelled" && (
                  <XCircle size={12} strokeWidth={2.2} aria-hidden="true" />
                )}
                {order.status === "shipped" && (
                  <Truck size={12} strokeWidth={2.2} aria-hidden="true" />
                )}
                {STATUS_LABELS[order.status]}
              </span>

              <button
                type="button"
                onClick={onReset}
                className="group inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <RotateCcw
                  size={13}
                  strokeWidth={2.2}
                  className="transition-transform group-hover:-rotate-90"
                  aria-hidden="true"
                />
                Track Another
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS RIBBON */}
      <div
        className="animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Order Progress
        </h2>
        <StatusRibbon currentStatus={order.status} />
      </div>

      {/* CONTENT GRID */}
      <div
        className="grid animate-fade-in gap-6 md:grid-cols-5"
        style={{ animationDelay: "160ms" }}
      >
        {/* Items */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
            <h3 className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Package size={12} strokeWidth={2} aria-hidden="true" />
              Items ({order.items.length})
            </h3>

            <div className="flex flex-col divide-y divide-border">
              {order.items.map((item, idx) => {
                const variantLabel = [item.size, item.color]
                  .filter(Boolean)
                  .join(" / ");

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary"
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-foreground">
                        {item.name}
                      </p>
                      {variantLabel && (
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                          {variantLabel}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        Qty {item.quantity} × {taka(item.unitPrice)}
                      </p>
                    </div>

                    <p className="shrink-0 font-mono text-[13.5px] font-semibold text-foreground">
                      {taka(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <Separator className="my-5" />

            <div className="space-y-2 text-[12.5px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{taka(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span className="font-mono text-primary">
                    − {taka(order.discountTotal)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-mono">
                  {order.shippingFee === 0 ? "Free" : taka(order.shippingFee)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="text-[13px] font-semibold text-foreground">
                Total
              </span>
              <span className="font-mono text-[18px] font-bold text-foreground">
                {taka(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery + payment */}
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
            <h3 className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <MapPin size={12} strokeWidth={2} aria-hidden="true" />
              Delivery Address
            </h3>

            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[13px] font-medium leading-relaxed text-foreground">
                {location}
              </p>
            </div>

            <div className="mt-5 space-y-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Courier</span>
                <span className="font-medium text-foreground">Pathao</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Est. Delivery</span>
                <span className="font-medium text-foreground">1–2 days</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
            <h3 className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Wallet size={12} strokeWidth={2} aria-hidden="true" />
              Payment
            </h3>

            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="font-medium text-foreground">
                {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  PAYMENT_STATUS_STYLES[order.paymentStatus],
                )}
              >
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </span>
            </div>

            {partlyPaid && (
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-[12px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Paid</span>
                  <span className="font-mono">{taka(order.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Due</span>
                  <span className="font-mono">
                    {taka(Math.max(0, order.total - order.paidAmount))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <ShieldCheck
                  size={14}
                  strokeWidth={2}
                  className="text-primary"
                  aria-hidden="true"
                />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-foreground">
                  Need help?
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  Contact our support team — we usually respond within an hour.
                </p>
                <Link
                  href="/contact"
                  className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Contact Support
                  <ArrowUpRight
                    size={12}
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STATUS RIBBON
   ============================================================ */

function StatusRibbon({ currentStatus }: { currentStatus: AdminOrderStatus }) {
  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <XCircle
            size={17}
            strokeWidth={2}
            className="text-destructive"
            aria-hidden="true"
          />
        </span>
        <p className="text-[13px] font-semibold text-destructive">
          {STATUS_MESSAGES.cancelled}
        </p>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);
  const fillPercent = (currentIndex / (STAGES.length - 1)) * 75;

  return (
    <>
      {/* Desktop: টানা বার, বর্তমান ধাপ পর্যন্ত ভরাট */}
      <div className="relative hidden sm:block">
        <div
          aria-hidden="true"
          className="absolute left-[12.5%] right-[12.5%] top-[21px] h-0.5 rounded-full bg-border"
        />
        <div
          aria-hidden="true"
          className="absolute left-[12.5%] top-[21px] h-0.5 rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${fillPercent}%` }}
        />

        <div className="relative grid grid-cols-4">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isDone = i <= currentIndex;
            const isCurrent = i === currentIndex;

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center gap-2.5"
              >
                <div
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 bg-card transition-colors ${
                    isDone
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 animate-ping rounded-full bg-primary/30"
                    />
                  )}
                  <Icon
                    size={16}
                    strokeWidth={2}
                    className="relative"
                    aria-hidden="true"
                  />
                </div>
                <span
                  className={`whitespace-nowrap text-[11.5px] font-semibold ${
                    isDone ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col sm:hidden">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isDone = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isDone
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 animate-ping rounded-full bg-primary/30"
                    />
                  )}
                  <Icon
                    size={15}
                    strokeWidth={2}
                    className="relative"
                    aria-hidden="true"
                  />
                </div>
                {!isLast && (
                  <div
                    className={`min-h-[32px] w-0.5 flex-1 transition-colors ${
                      i < currentIndex ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <div className="pb-8">
                <p
                  className={`text-[13.5px] font-semibold ${
                    isDone ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-[11px] font-medium text-primary">
                    Current status
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* বর্তমান অবস্থার বার্তা */}
      <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary"
        />
        <p className="text-[12.5px] font-medium text-foreground">
          {STATUS_MESSAGES[currentStatus]}
        </p>
      </div>
    </>
  );
}
