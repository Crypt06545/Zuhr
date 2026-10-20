// lib/api/categories.api.ts
import { API } from "@/lib/axios";

export type Category = { _id: string; name: string; slug?: string };

type CategoryList = { data: Category[]; meta?: unknown };

const pickList = (value: unknown): Category[] | null => {
  if (Array.isArray(value)) return value as Category[];

  if (value && typeof value === "object") {
    const inner = (value as CategoryList).data;
    if (Array.isArray(inner)) return inner;

    const nested = pickList(inner);
    if (nested) return nested;
  }

  return null;
};

// Admin form needs every category in one dropdown, so ask for the max page size
export const getCategoriesApi = (signal?: AbortSignal): Promise<Category[]> =>
  API.get("/categories", { params: { limit: 100 }, signal }).then(
    (res) => pickList(res.data) ?? [],
  );
