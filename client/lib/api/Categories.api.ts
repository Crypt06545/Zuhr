// lib/api/categories.api.ts
import { API } from "@/lib/axios";

export type Category = { _id: string; name: string };

// TODO: change the route if your categories endpoint is different
export const getCategoriesApi = (): Promise<Category[]> =>
  API.get("/categories").then((res) => {
    const body = res.data?.data ?? res.data;
    if (Array.isArray(body)) return body;
    return body?.categories ?? body?.items ?? [];
  });
