"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { shippingFeeFor } from "@/lib/checkout-config";
import type { CheckoutFormValues } from "@/lib/checkout";
import { cartSavings, cartSubtotal, useCartStore } from "@/store/cart-store";

// দেখানোর জন্য হিসাব। আসল মোট অর্ডারের সময় ব্যাকএন্ড নিজে ঠিক করে ও ফেরত দেয়।
// checkout ফর্মের ভেতর থেকে ডাকতে হবে (বাছা জেলা পড়ে)।
export const useCheckoutTotals = () => {
  const { control } = useFormContext<CheckoutFormValues>();
  const district = useWatch({ control, name: "district" });

  const items = useCartStore((state) => state.items);
  const shipping = shippingFeeFor(district); // জেলা না বাছলে null

  return useMemo(() => {
    const subtotal = cartSubtotal(items);

    return {
      count: items.reduce((total, item) => total + item.quantity, 0),
      subtotal,
      savings: cartSavings(items),
      shipping,
      total: subtotal + (shipping ?? 0),
    };
  }, [items, shipping]);
};
