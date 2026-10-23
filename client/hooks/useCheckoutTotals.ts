"use client";

import { useMemo } from "react";

import { useOrderConfig } from "@/hooks/useOrderConfig";
import { cartSavings, cartSubtotal, useCartStore } from "@/store/cart-store";

// দেখানোর জন্য হিসাব। আসল মোট অর্ডারের সময় সার্ভার ঠিক করে ও ফেরত দেয়।
export const useCheckoutTotals = () => {
  const items = useCartStore((state) => state.items);
  const { data } = useOrderConfig();

  const shipping = data?.shippingFee ?? null; // সার্ভার থেকে না আসা পর্যন্ত null

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
