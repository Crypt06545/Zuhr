export type OrderStatus = "delivered" | "shipped" | "processing" | "cancelled";

export interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  amount: number;
  status: OrderStatus;
  date: string; // ISO
}

// Mock data: replace with your real API response later
export const ORDERS: Order[] = [
  {
    id: "#1001",
    customer: "Rahim Uddin",
    email: "rahim@example.com",
    product: "Oud Attar 12ml",
    amount: 3200,
    status: "delivered",
    date: "2026-10-02",
  },
  {
    id: "#1002",
    customer: "Nusrat Jahan",
    email: "nusrat@example.com",
    product: "Rose Attar 6ml",
    amount: 1800,
    status: "shipped",
    date: "2026-10-04",
  },
  {
    id: "#1003",
    customer: "Tanvir Hasan",
    email: "tanvir@example.com",
    product: "Oud Attar 12ml",
    amount: 3200,
    status: "processing",
    date: "2026-10-06",
  },
  {
    id: "#1004",
    customer: "Sadia Akter",
    email: "sadia@example.com",
    product: "Musk Attar 6ml",
    amount: 1500,
    status: "cancelled",
    date: "2026-10-07",
  },
  {
    id: "#1005",
    customer: "Imran Hossain",
    email: "imran@example.com",
    product: "Rose Attar 6ml",
    amount: 1800,
    status: "delivered",
    date: "2026-10-09",
  },
];

// Mock fetcher: replace the body with your real API call later
export const getOrders = async (): Promise<Order[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return ORDERS;
};
