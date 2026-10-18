// lib/products-api.ts  (public storefront API)
import axios from "axios";

import { API } from "@/lib/axios";

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
