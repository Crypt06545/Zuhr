"use client";

import { useQuery } from "@tanstack/react-query";

import { getOrderConfigApi } from "@/lib/api/orders.api";

// ডেলিভারি চার্জ সার্ভার থেকে: ফ্রন্টএন্ডে আলাদা সংখ্যা রাখলে সার্ভারের সঙ্গে গরমিল হতে পারে,
// আর bKash/Nagad-এ ভুল টাকা পাঠানোর নির্দেশ যেত।
export const useOrderConfig = () =>
  useQuery({
    queryKey: ["order-config"],
    queryFn: getOrderConfigApi,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
