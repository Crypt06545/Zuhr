"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/hooks/use-auth";
import { deleteProduct, updateProduct } from "@/lib/api/mutations";
import type { Product } from "@/lib/mock-products";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ProductEditDialog } from "./ProductEditDialog";
import {
  getStockState,
  STOCK_STATE_META,
  type StockState,
} from "./ProductStatusBadge";
import { ProductsTable } from "./ProductsTable";

type Filter = "all" | StockState;

const FILTERS: Filter[] = ["all", "in_stock", "low_stock", "out_of_stock"];

export const ProductsManager = ({ products }: { products: Product[] }) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesFilter =
        filter === "all" || getStockState(p.stock) === filter;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [products, query, filter]);

  // Demo mode: the list does not change. After a real API call succeeds,
  // call router.refresh() here so the page re-fetches the products.
  const handleSave = async (updated: Product) => {
    try {
      await updateProduct(updated);
      toast.success(`${updated.name} updated.`);
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update product."));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);

    try {
      await deleteProduct(deleting.id);
      toast.success(`${deleting.name} deleted.`);
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete product."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>All products</CardTitle>
            <CardDescription>
              Showing {visible.length} of {products.length} products
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="h-9 pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={filter === item ? "default" : "outline"}
                  onClick={() => setFilter(item)}
                >
                  {item === "all" ? "All" : STOCK_STATE_META[item].label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ProductsTable
            products={visible}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        </CardContent>
      </Card>

      <ProductEditDialog
        product={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleting(null);
        }}
        title="Delete this product?"
        description={`${deleting?.name ?? "This product"} will be removed. This action cannot be undone.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
};
