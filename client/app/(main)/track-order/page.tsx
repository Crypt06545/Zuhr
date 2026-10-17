"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
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
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

type OrderStatus =
  | "Processing"
  | "Confirmed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type OrderItem = {
  name: string;
  variantLabel?: string;
  quantity: number;
  price: number;
};

type Order = {
  orderId: string;
  createdAt: string;
  order_status: OrderStatus;
  items: OrderItem[];
  subTotalAmt: number;
  discountAmount: number;
  shippingCharge: number;
  totalAmt: number;
  shippingAddress: { area?: string; city?: string };
};

type TrackOrderFormData = { orderId: string };

/* ============================================================
   HARDCODED DEMO DATA
   ============================================================ */

const DEMO_ORDER: Order = {
  orderId: "ZUHR-10432",
  createdAt: "2026-07-22T10:30:00.000Z",
  order_status: "Shipped",
  items: [
    { name: "Rose Oud Attar", variantLabel: "12ml", quantity: 1, price: 1450 },
    { name: "Amber Musk Attar", variantLabel: "6ml", quantity: 2, price: 850 },
    { name: "Leather Desk Pad", quantity: 1, price: 1200 },
  ],
  subTotalAmt: 4350,
  discountAmount: 350,
  shippingCharge: 0,
  totalAmt: 4000,
  shippingAddress: { area: "Gulshan 2", city: "Dhaka 1212" },
};

/* ============================================================
   CONFIG
   ============================================================ */

const STAGES = [
  { key: "Processing", label: "Processing", icon: Clock },
  { key: "Confirmed", label: "Confirmed", icon: PackageCheck },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: Home },
] as const;

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  Processing:
    "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  Confirmed:
    "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
  Shipped: "bg-primary/10 text-primary border-primary/20",
  Delivered:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
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

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const initialRunRef = useRef(false);

  const trackOrder = async (rawId: string) => {
    const trimmed = rawId.trim();
    if (!trimmed) return;

    setSubmitError(null);
    setIsLoading(true);
    setActiveId(trimmed);

    await new Promise((r) => setTimeout(r, 800));

    if (trimmed.toUpperCase() === "ZUHR-10432") {
      setOrder(DEMO_ORDER);
    } else {
      setSubmitError("Order not found. Please check your Order ID.");
      setOrder(null);
    }
    setIsLoading(false);
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
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Track Your Order
            </h1>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              Enter your Order ID or scan the QR code from your invoice.
            </p>
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
                placeholder="Enter your Order ID"
                autoComplete="off"
                aria-invalid={!!errors.orderId}
                className="h-11 rounded-lg border-border bg-background pl-10 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
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
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
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
                <Search size={16} strokeWidth={2.2} aria-hidden="true" />
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
   LOADING STATE
   ============================================================ */

function LoadingState({ id }: { id: string | null }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card py-20 shadow-sm">
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Loader2
            size={20}
            strokeWidth={2}
            className="animate-spin text-primary"
            aria-hidden="true"
          />
        </span>
      </span>
      <div className="text-center">
        <p className="text-[13.5px] font-medium text-foreground">
          Looking up your order...
        </p>
        {id && (
          <p className="mt-1 font-mono text-[11.5px] text-muted-foreground">
            {id}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ORDER RESULT
   ============================================================ */

type OrderResultProps = { order: Order; onReset: () => void };

function OrderResult({ order, onReset }: OrderResultProps) {
  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
        <div className="flex flex-wrap items-center justify-end gap-4">
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

        <Separator className="my-6" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Hash
                size={14}
                strokeWidth={1.9}
                className="text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">
                Order ID
              </span>
              <span className="font-mono text-[13.5px] font-semibold text-foreground">
                {order.orderId}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-BD", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${STATUS_BADGE_STYLES[order.order_status]}`}
          >
            {order.order_status === "Delivered" && (
              <CheckCircle2 size={12} strokeWidth={2.2} aria-hidden="true" />
            )}
            {order.order_status === "Cancelled" && (
              <XCircle size={12} strokeWidth={2.2} aria-hidden="true" />
            )}
            {order.order_status === "Shipped" && (
              <Truck size={12} strokeWidth={2.2} aria-hidden="true" />
            )}
            {order.order_status}
          </span>
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
        <StatusRibbon currentStatus={order.order_status} />
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
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-foreground">
                      {item.name}
                      {item.variantLabel && (
                        <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">
                          ({item.variantLabel})
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      Qty {item.quantity} × ৳
                      {item.price.toLocaleString("en-BD")}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-[13.5px] font-semibold text-foreground">
                    ৳{(item.price * item.quantity).toLocaleString("en-BD")}
                  </p>
                </div>
              ))}
            </div>

            <Separator className="my-5" />

            <div className="space-y-2 text-[12.5px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">
                  ৳{order.subTotalAmt.toLocaleString("en-BD")}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span className="font-mono text-primary">
                    − ৳{order.discountAmount.toLocaleString("en-BD")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-mono">
                  {order.shippingCharge === 0
                    ? "Free"
                    : `৳${order.shippingCharge.toLocaleString("en-BD")}`}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between pt-1 text-[14px] font-bold text-foreground">
                <span>Total</span>
                <span className="font-mono">
                  ৳{order.totalAmt.toLocaleString("en-BD")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
            <h3 className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <MapPin size={12} strokeWidth={2} aria-hidden="true" />
              Delivery Address
            </h3>

            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[13px] font-medium leading-relaxed text-foreground">
                {[order.shippingAddress.area, order.shippingAddress.city]
                  .filter(Boolean)
                  .join(", ") || "—"}
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-medium text-foreground">
                  Cash on Delivery
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
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

function StatusRibbon({ currentStatus }: { currentStatus: OrderStatus }) {
  if (currentStatus === "Cancelled") {
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
          This order was cancelled.
        </p>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <>
      {/* Desktop */}
      <div className="hidden items-center sm:flex">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isDone = i <= currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div
              key={stage.key}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex shrink-0 flex-col items-center gap-2.5">
                <div
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${
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

              {i < STAGES.length - 1 && (
                <div
                  className={`mx-2 mb-6 h-0.5 flex-1 rounded-full transition-colors ${
                    i < currentIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
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
    </>
  );
}
