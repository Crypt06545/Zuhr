"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ImageOff, ShoppingBag } from "lucide-react";

import { useCheckoutTotals } from "@/hooks/useCheckoutTotals";
import { formatPrice } from "@/lib/api/Products.api";
import { itemKey, useCartStore, useCartUi } from "@/store/cart-store";

import ConfirmButton from "./ConfirmButton";

const OrderSummary = () => {
  const items = useCartStore((state) => state.items);
  const openCart = useCartUi((state) => state.openCart);
  const { count, subtotal, savings, shipping, total } = useCheckoutTotals();

  // ফোনে ডিফল্টে বন্ধ (ওপরে শুধু মোট দেখায়), বড় স্ক্রিনে সবসময় খোলা
  const [open, setOpen] = useState(false);

  return (
    <aside className="order-first lg:sticky lg:top-40 lg:order-none lg:self-start">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="order-summary-body"
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left lg:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {open ? "Hide" : "Show"} order summary
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </span>
          <span className="text-[16px] font-bold tabular-nums">
            {formatPrice(total)}
          </span>
        </button>

        <div
          id="order-summary-body"
          className={`${open ? "block" : "hidden"} border-t border-border lg:block lg:border-t-0`}
        >
          <div className="hidden items-center justify-between px-6 pb-2 pt-6 lg:flex">
            <h2 className="text-[16px] font-semibold">
              Order summary{" "}
              <span className="font-normal text-muted-foreground">
                ({count})
              </span>
            </h2>
            <button
              type="button"
              onClick={openCart}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Edit cart
            </button>
          </div>

          <ul className="max-h-[40vh] divide-y divide-border overflow-y-auto overscroll-contain px-4 lg:px-6">
            {items.map((item) => {
              const option = [item.size, item.color]
                .filter(Boolean)
                .join(" / ");

              return (
                <li key={itemKey(item)} className="flex gap-3 py-3">
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
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-bold text-background">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-5">
                      {item.name}
                    </p>
                    {option && (
                      <p className="truncate text-xs text-muted-foreground">
                        {option}
                      </p>
                    )}
                  </div>

                  <p className="shrink-0 text-[13px] font-semibold tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="space-y-2.5 border-t border-border px-4 py-4 text-sm lg:px-6">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>

            {savings > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>You save</dt>
                <dd className="tabular-nums">{formatPrice(savings)}</dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">
                {shipping === null ? (
                  <span className="text-xs text-muted-foreground">
                    Select district
                  </span>
                ) : shipping === 0 ? (
                  "Free"
                ) : (
                  formatPrice(shipping)
                )}
              </dd>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="text-[15px] font-semibold">Total</dt>
              <dd className="text-xl font-bold tabular-nums">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>

          {/* বড় স্ক্রিনে বাটন এখানে, ফোনে ফর্মের শেষে */}
          <div className="hidden px-6 pb-6 lg:block">
            <ConfirmButton />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
