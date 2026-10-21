// lib/axios.ts
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

declare module "axios" {
  interface AxiosRequestConfig {
    skipLoginRedirect?: boolean;
  }
}

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // refreshToken httpOnly cookie পাঠাতে/পেতে জরুরি
});

// প্রতিটা request এ accessToken automatic বসিয়ে দিচ্ছি
API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// একাধিক জায়গা একসাথে refresh চাইলেও যেন বারবার call না হয়,
// একটাই promise শেয়ার করছি সবার মধ্যে
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        const newToken = res.data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Page reload এর পর accessToken memory তে থাকে না। প্রথম request টা token ছাড়া গেলে
// backend 401 দেয় (তারপর interceptor refresh করে আবার পাঠায়)।
// এই function টা প্রথম request এর আগেই token এনে দেয়, তাই কোনো 401 আর হয় না।
// Token আনতে না পারলে null (মানে login করা নেই)।
export const ensureAccessToken = async (): Promise<string | null> => {
  const existing = useAuthStore.getState().accessToken;
  if (existing) return existing;

  try {
    return await refreshAccessToken();
  } catch {
    return null;
  }
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch {
        // Refresh ও fail করলে session সত্যিই শেষ
        useAuthStore.getState().clearAuth();
        if (
          !originalRequest.skipLoginRedirect &&
          typeof window !== "undefined"
        ) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);
