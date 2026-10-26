"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getAdminAnalyticsApi,
  type AnalyticsRange,
} from "@/lib/api/admin-analytics.api";

export const analyticsQueryKey = (range?: AnalyticsRange) =>
  [
    "admin",
    "analytics",
    range?.from ?? "default",
    range?.to ?? "default",
  ] as const;

export const useAdminAnalytics = (range?: AnalyticsRange) =>
  useQuery({
    queryKey: analyticsQueryKey(range),
    queryFn: () => getAdminAnalyticsApi(range),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
