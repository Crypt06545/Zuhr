// lib/api/customers.api.ts
import { API } from "@/lib/axios";
import type { CursorPage } from "@/hooks/Usecursorpagination";

// TODO: match the route and the fields to your customers backend
export type Customer = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  ordersCount?: number;
  createdAt: string;
};

export type CustomersFilters = { search?: string };

export const getAdminCustomersApi = (
  params: CustomersFilters & { limit?: number; cursor?: string },
): Promise<CursorPage<Customer>> =>
  API.get("/users/admin/list", { params }).then(
    (res) => res.data?.data ?? res.data,
  );
