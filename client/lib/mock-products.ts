export type ProductStatus = "active" | "draft";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
}

// Mock data: replace with your real API response later
export const PRODUCTS: Product[] = [
  {
    id: "P-001",
    name: "Oud Attar 12ml",
    category: "Oud",
    price: 3200,
    stock: 24,
    status: "active",
  },
  {
    id: "P-002",
    name: "Rose Attar 6ml",
    category: "Floral",
    price: 1800,
    stock: 40,
    status: "active",
  },
  {
    id: "P-003",
    name: "Musk Attar 6ml",
    category: "Musk",
    price: 1500,
    stock: 0,
    status: "active",
  },
  {
    id: "P-004",
    name: "Amber Attar 12ml",
    category: "Amber",
    price: 2800,
    stock: 12,
    status: "draft",
  },
  {
    id: "P-005",
    name: "Sandalwood Attar 6ml",
    category: "Woody",
    price: 2200,
    stock: 8,
    status: "active",
  },
];

// Mock fetcher: replace the body with your real API call later
export const getProducts = async (): Promise<Product[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return PRODUCTS;
};
