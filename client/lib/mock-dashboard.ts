export type OrderStatus = "delivered" | "shipped" | "processing" | "cancelled";
export type PaymentMethod = "cod" | "bkash" | "nagad" | "card";
export type PaymentStatus = "paid" | "unpaid" | "refunded";

export interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  product: string;
  quantity: number;
  amount: number; // order total
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note: string;
  date: string; // ISO
}

// Mock data: replace with your real API response later
export const ORDERS: Order[] = [
  {
    id: "#1001",
    customer: "Rahim Uddin",
    email: "rahim@example.com",
    phone: "01712000001",
    address: "House 12, Road 4, Sherpur Road",
    city: "Bogura",
    product: "Oud Attar 12ml",
    quantity: 1,
    amount: 3200,
    status: "delivered",
    paymentMethod: "cod",
    paymentStatus: "paid",
    note: "",
    date: "2026-10-02",
  },
  {
    id: "#1002",
    customer: "Nusrat Jahan",
    email: "nusrat@example.com",
    phone: "01812000002",
    address: "Flat 5B, Green Road",
    city: "Dhaka",
    product: "Rose Attar 6ml",
    quantity: 1,
    amount: 1800,
    status: "shipped",
    paymentMethod: "bkash",
    paymentStatus: "paid",
    note: "Gift wrap please",
    date: "2026-10-04",
  },
  {
    id: "#1003",
    customer: "Tanvir Hasan",
    email: "tanvir@example.com",
    phone: "01912000003",
    address: "Station Road, Ward 7",
    city: "Rajshahi",
    product: "Oud Attar 12ml",
    quantity: 1,
    amount: 3200,
    status: "processing",
    paymentMethod: "nagad",
    paymentStatus: "unpaid",
    note: "",
    date: "2026-10-06",
  },
  {
    id: "#1004",
    customer: "Sadia Akter",
    email: "sadia@example.com",
    phone: "01612000004",
    address: "Lane 3, Agrabad",
    city: "Chattogram",
    product: "Musk Attar 6ml",
    quantity: 1,
    amount: 1500,
    status: "cancelled",
    paymentMethod: "card",
    paymentStatus: "refunded",
    note: "Customer changed mind",
    date: "2026-10-07",
  },
  {
    id: "#1005",
    customer: "Imran Hossain",
    email: "imran@example.com",
    phone: "01512000005",
    address: "Zindabazar Main Road",
    city: "Sylhet",
    product: "Rose Attar 6ml",
    quantity: 1,
    amount: 1800,
    status: "delivered",
    paymentMethod: "cod",
    paymentStatus: "paid",
    note: "",
    date: "2026-10-09",
  },
];

// Mock fetcher: replace the body with your real API call later
export const getOrders = async (): Promise<Order[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return ORDERS;
};
