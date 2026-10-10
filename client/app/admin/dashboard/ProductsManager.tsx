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
import type { Product } from "@/lib/mock-products";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ProductEditDialog } from "./ProductEditDialog";
import {
  getProductState,
  PRODUCT_STATE_META,
  type ProductState,
} from "./ProductStatusBadge";
import { ProductsTable } from "./ProductsTable";

type Filter = "all" | ProductState;

const FILTERS: Filter[] = ["all", "active", "draft", "out_of_stock"];

export const ProductsManager = ({
  initialProducts,
}: {
  initialProducts: Product[];
}) => {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesFilter = filter === "all" || getProductState(p) === filter;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [products, query, filter]);

  const handleSave = (updated: Product) => {
    // Local state only: call your API here, then update state on success
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    toast.success(`${updated.name} updated.`);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    // Local state only: call your API here, then update state on success
    setProducts((prev) => prev.filter((p) => p.id !== deleting.id));
    toast.success(`${deleting.name} deleted.`);
    setDeleting(null);
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
                  {item === "all" ? "All" : PRODUCT_STATE_META[item].label}
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
          if (!open) setDeleting(null);
        }}
        title="Delete this product?"
        description={`${deleting?.name ?? "This product"} will be removed. This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  );
};
