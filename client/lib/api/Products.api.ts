// lib/api/Products.api.ts  (public storefront + admin API)
import axios from "axios";

import { API } from "@/lib/axios";
import type { CursorPage } from "@/hooks/Usecursorpagination";

/* ============================================================
   PUBLIC STOREFRONT
   ============================================================ */

// categories.api.ts er Category type er same, tai alada import lage na
export type Category = { _id: string; name: string; slug?: string };

export type SortOption = "newest" | "price_asc" | "price_desc";

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface ProductVariant {
  _id: string;
  size: string;
  color?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  images: ProductImage[];
  variants: ProductVariant[];
  stockStatus: string;
}

export interface ProductListResult {
  items: Product[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ProductQuery {
  limit: number;
  cursor?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortOption;
}

// axios undefined param skip kore, tai faka filter jay na
export const fetchProducts = (
  query: ProductQuery,
  signal?: AbortSignal,
): Promise<ProductListResult> =>
  API.get("/products", {
    params: {
      limit: query.limit,
      cursor: query.cursor,
      category: query.category,
      search: query.search,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock ? true : undefined,
      sort: query.sort && query.sort !== "newest" ? query.sort : undefined,
    },
    signal,
  }).then((res) => res.data?.data ?? res.data);

/* ---------- helpers ---------- */

export const isAbortError = (error: unknown) => axios.isCancel(error);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    return message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
};

export const formatPrice = (amount: number) =>
  `৳${amount.toLocaleString("en-IN")}`;

// StockStatus value ja-i hok (OUT_OF_STOCK / out_of_stock / out-of-stock) kaj korbe
const normalize = (value: string) =>
  value.toLowerCase().replace(/[\s-]+/g, "_");

export const isOutOfStock = (status: string) =>
  normalize(status) === "out_of_stock";

export const isLowStock = (status: string) => normalize(status) === "low_stock";

/* ============================================================
   ADMIN (restored from commit 94a231d)
   ============================================================ */

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type ProductStatus = "draft" | "active" | "archived";

// One row of GET /products/admin/list

export type AdminProduct = {
  _id: string;
  name: string;
  category: string | { _id: string; name: string };
  images?: { url: string; publicId: string }[];
  variants: { price: number }[];
  totalStock: number;
};
// GET /products/admin/:id (the full product, used by the edit form)
export type AdminProductDetail = {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  brand?: string;
  category: string | { _id: string; name: string };
  images: { url: string; publicId: string }[];
  variants: {
    _id: string;
    size: string;
    color?: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    costPrice: number;
    stock: number;
  }[];
  lowStockThreshold: number;
  totalStock: number;
  stockStatus: StockStatus;
  badges: string[];
  tags: string[];
  status: ProductStatus;
  updatedAt: string;
};

export type AdminProductsFilters = {
  search?: string;
  stockStatus?: StockStatus;
};

// axios skips undefined params, so empty filters are not sent
export const getAdminProductsApi = (
  params: AdminProductsFilters & { limit?: number; cursor?: string },
): Promise<CursorPage<AdminProduct>> =>
  API.get("/products/admin/list", { params }).then(
    (res) => res.data?.data ?? res.data,
  );

export const getAdminProductApi = (id: string): Promise<AdminProductDetail> =>
  API.get(`/products/admin/${id}`).then((res) => res.data?.data ?? res.data);

// Multipart: the images go in the "images" field
export const createProductApi = (formData: FormData) =>
  API.post("/products", formData).then((res) => res.data);

export const updateProductApi = (id: string, formData: FormData) =>
  API.patch(`/products/${id}`, formData).then((res) => res.data);

// Stock of an existing variant can only be changed through this endpoint
export const updateVariantStockApi = (
  productId: string,
  variantId: string,
  body: { type: "set" | "adjust"; quantity: number },
) =>
  API.patch(`/products/${productId}/variants/${variantId}/stock`, body).then(
    (res) => res.data,
  );

export const deleteProductApi = (id: string) =>
  API.delete(`/products/${id}`).then((res) => res.data);
