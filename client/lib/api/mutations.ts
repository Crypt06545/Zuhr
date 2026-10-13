import type { Order, OrderStatus } from "@/lib/mock-dashboard";
import type { Product } from "@/lib/mock-products";

// Mock mutations: they only wait and succeed, nothing is saved or removed.
// Replace each body with your real API call. If the request fails, just throw:
// the UI shows an error toast and keeps the dialog open.
const wait = () => new Promise((resolve) => setTimeout(resolve, 600));

export const updateProduct = async (product: Product) => {
  await wait();
  return product;
};

export const deleteProduct = async (id: string) => {
  await wait();
  return { id };
};

export const updateOrder = async (order: Order) => {
  await wait();
  return order;
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  await wait();
  return { id, status };
};

export const deleteOrder = async (id: string) => {
  await wait();
  return { id };
};
