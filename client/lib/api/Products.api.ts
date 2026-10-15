// lib/api/products.api.ts
import { API } from "@/lib/axios";
import type { CursorPage } from "@/hooks/Usecursorpagination";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type ProductStatus = "draft" | "active" | "archived";

// One row of GET /products/admin/list
export type AdminProduct = {
  _id: string;
  name: string;
  category: string | { _id: string; name: string };
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
