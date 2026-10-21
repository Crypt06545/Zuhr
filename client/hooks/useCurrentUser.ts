"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { API, ensureAccessToken } from "@/lib/axios";
import { useAuthStore } from "@/store/auth-store";

export type CurrentUser = {
  name: string;
  email?: string;
  role?: string;
};

export const ME_QUERY_KEY = ["me"] as const;

// /auth/me দেয় { data: { userId, email, userType } }, name দেয় না।
// name না থাকলে email-এর @ এর আগের অংশ নাম হিসেবে দেখাই।
const pickUser = (body: unknown): CurrentUser | null => {
  const root = (body as { data?: unknown })?.data ?? body;
  const raw = ((root as { user?: unknown })?.user ?? root) as
    | { name?: unknown; email?: unknown; userType?: unknown }
    | null
    | undefined;

  if (!raw || typeof raw !== "object") return null;

  const email = typeof raw.email === "string" ? raw.email : undefined;
  const name =
    typeof raw.name === "string" && raw.name.trim()
      ? raw.name.trim()
      : email?.split("@")[0];
  const role = typeof raw.userType === "string" ? raw.userType : undefined;

  return name ? { name, email, role } : null;
};

export const useCurrentUser = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const storeUser = useAuthStore((s) => s.user);

  // key-তে "token আছে কিনা" থাকে: login বা logout হলে key বদলায়, তাই নতুন করে আনে।
  // role সবসময় সার্ভার থেকে আসে (/auth/me), store-এর user-এ role নেই।
  const query = useQuery({
    queryKey: [...ME_QUERY_KEY, Boolean(accessToken)],
    queryFn: async (): Promise<CurrentUser | null> => {
      const token = await ensureAccessToken();
      if (!token) return null;

      try {
        const res = await API.get("/auth/me", { skipLoginRedirect: true });
        return pickUser(res.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  const fetched = accessToken ? (query.data ?? null) : null;

  // login-এর পরপরই store-এর নাম দেখাই, role আসা পর্যন্ত অপেক্ষা করে না
  const data: CurrentUser | null =
    fetched ??
    (accessToken && storeUser
      ? { name: storeUser.name, email: storeUser.email }
      : null);

  return {
    data,
    isLoading: !data && query.isLoading,
    isAdmin: fetched?.role?.toLowerCase() === "admin",
  };
};
