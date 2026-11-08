"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getAdminFinanceApi,
  type FinanceRange,
} from "@/lib/api/admin-finance.api";
import { FINANCE_KEY } from "@/lib/admin-expenses";

// খরচ যোগ/এডিট/void হলে FINANCE_KEY refresh হয়, তাই কার্ড নিজে থেকে ঠিক হয়ে যায়
export const useAdminFinance = (range?: FinanceRange) =>
  useQuery({
    queryKey: [...FINANCE_KEY, range?.from, range?.to],
    queryFn: () => getAdminFinanceApi(range as FinanceRange),
    enabled: !!range,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
