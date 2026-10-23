"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ImageOff, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  apiErrorStatus,
  getMyOrderApi,
  type OrderView,
} from "@/lib/api/orders.api";
import { formatPrice } from "@/lib/api/Products.api";

const METHOD_LABEL: Record<OrderView["paymentMethod"], string> = {
  cod: "Cash on delivery",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const Pill = ({ children }: { children: string }) => (
  <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
    {children}
  </span>
);

const Skeleton = () => (
  <div className="mx-auto max-w-3xl space-y-6">
    <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
    <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
  </div>
);

const NotFound = ({ notFound }: { notFound: boolean }) => (
  <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
    <PackageSearch className="mb-4 h-10 w-10 text-muted-foreground" />
    <h2 className="text-lg font-semibold">
      {notFound ? "Order not found" : "Could not load your order"}
    </h2>
    <p className="mb-5 mt-1 text-sm text-muted-foreground">
      {notFound
        ? "This order does not exist or belongs to another account."
        : "Please check your connection and try again."}
    </p>
    <Link
      href="/products"
      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/50 hover:text-primary"
    >
      Continue shopping
    </Link>
  </div>
);

const OrderSuccessView = () => {
  const params = useParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-order", id],
    queryFn: () => getMyOrderApi(id as string),
    enabled: !!id,
    retry: false,
  });

  if (isLoading || !id) {
    return (
      <main className="container mx-auto px-4 py-8 lg:px-6 lg:py-12">
        <Skeleton />
      </main>
    );
  }

  if (isError || !order) {
    const notFound = apiErrorStatus(error) === 404;

    return (
      <main className="container mx-auto px-4 py-12 lg:px-6">
        <NotFound notFound={notFound} />
        {!notFound && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}
      </main>
    );
  }

  const mobilePayment =
    order.paymentMethod === "bkash" || order.paymentMethod === "nagad";
  const address = order.shippingAddress;

  return (
    <main className="container mx-auto px-4 py-8 lg:px-6 lg:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <section className="rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            Thank you, your order is placed!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Order number</p>
          <p className="mt-0.5 break-all font-mono text-lg font-bold tracking-wide">
            {order.orderNumber}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Pill>{`Status: ${capitalize(order.status)}`}</Pill>
            <Pill>{`Payment: ${METHOD_LABEL[order.paymentMethod]}`}</Pill>
            <Pill>{`Payment status: ${capitalize(order.paymentStatus)}`}</Pill>
          </div>

          <p className="mx-auto mt-5 max-w-md text-sm text-muted-foreground">
            {mobilePayment ? (
              <>
                We are verifying your payment
                {order.paymentTransactionId && (
                  <>
                    {" "}
                    (transaction ID{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {order.paymentTransactionId}
                    </span>
                    )
                  </>
                )}
                . Your order moves to processing once it is verified.
              </>
            ) : (
              "Please keep the amount ready. You pay in cash when your order arrives."
            )}
          </p>
        </section>

        {/* Items */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-2 text-[16px] font-semibold">Items</h2>

          <ul className="divide-y divide-border">
            {order.items.map((item, index) => {
              const option = [item.size, item.color]
                .filter(Boolean)
                .join(" / ");

              return (
                <li key={`${item.slug}-${index}`} className="flex gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 rounded-lg border border-border bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOff className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-5">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[option, `Qty ${item.quantity}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13px] font-semibold tabular-nums">
                    {formatPrice(item.lineTotal)}
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="mt-2 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Discount</dt>
                <dd className="tabular-nums">
                  -{formatPrice(order.discountTotal)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">
                {order.shippingFee === 0
                  ? "Free"
                  : formatPrice(order.shippingFee)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="text-[15px] font-semibold">Total</dt>
              <dd className="text-xl font-bold tabular-nums">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Delivery */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-3 text-[16px] font-semibold">Delivery address</h2>
          <address className="space-y-0.5 text-sm not-italic">
            <p className="font-semibold">{address.fullName}</p>
            <p className="text-muted-foreground">{address.phone}</p>
            <p>{address.addressLine}</p>
            <p>
              {[address.city, address.district]
                .filter((v, i, a) => v && a.indexOf(v) === i)
                .join(", ")}
            </p>
          </address>
          {order.note && (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note: </span>
              {order.note}
            </p>
          )}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/account/orders"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-6 text-[14px] font-semibold transition-colors hover:bg-muted"
          >
            View my orders
          </Link>
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderSuccessView;
