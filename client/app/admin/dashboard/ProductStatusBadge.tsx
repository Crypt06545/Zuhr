import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/mock-products";

export type ProductState = "active" | "draft" | "out_of_stock";

export const PRODUCT_STATE_META: Record<
  ProductState,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  active: { label: "Active", variant: "default" },
  draft: { label: "Draft", variant: "secondary" },
  out_of_stock: { label: "Out of stock", variant: "destructive" },
};

export const getProductState = (product: Product): ProductState => {
  if (product.status === "draft") return "draft";
  if (product.stock === 0) return "out_of_stock";
  return "active";
};

export const ProductStatusBadge = ({ state }: { state: ProductState }) => {
  const { label, variant } = PRODUCT_STATE_META[state];
  return <Badge variant={variant}>{label}</Badge>;
};
