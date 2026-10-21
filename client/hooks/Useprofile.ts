"use client";

import { useQuery } from "@tanstack/react-query";

import { getProfileApi } from "@/lib/api/user.api";

export const PROFILE_QUERY_KEY = ["profile"] as const;

// Account-এর সব পেজ ও কার্ড একই query শেয়ার করে: একবারই রিকোয়েস্ট যায়
export const useProfile = () =>
  useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfileApi,
    retry: false,
    staleTime: 60 * 1000,
  });
