// lib/api/coupons.api.ts
import { API } from "@/lib/axios";
import type { CursorPage } from "@/hooks/Usecursorpagination";

// TODO: match the route and the fields to your coupons backend
export type Coupon = {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  usedCount?: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
  isActive: boolean;
};

export type CouponsFilters = { search?: string };

export const getAdminCouponsApi = (
  params: CouponsFilters & { limit?: number; cursor?: string },
): Promise<CursorPage<Coupon>> =>
  API.get("/coupons/admin/list", { params }).then(
    (res) => res.data?.data ?? res.data,
  );
