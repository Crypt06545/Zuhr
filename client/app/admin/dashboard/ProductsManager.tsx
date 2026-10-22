"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

import type { Product } from "@/lib/mock-products";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { PaginationBar } from "@/components/common/Paginationbar";
import { EditProductSheet } from "./Editproductsheet";
import { STOCK_STATE_META, type StockState } from "./ProductStatusBadge";
import { ProductsTable } from "./ProductsTable";
import {
  useCursorPagination,
  useDebouncedValue,
} from "@/hooks/Usecursorpagination";
import {
  AdminProduct,
  AdminProductsFilters,
  deleteProductApi,
  getAdminProductsApi,
} from "@/lib/api/Products.api";
import { getCategoriesApi } from "@/lib/api/Categories.api";

type Filter = "all" | StockState;

const FILTERS: Filter[] = ["all", "in_stock", "low_stock", "out_of_stock"];
const PRODUCTS_KEY = ["admin-products"];

// Turns a backend product into the row shape the table already uses.
// The list sends only the category id, so the name comes from the categories list.
const toProduct = (
  p: AdminProduct,
  categoryNames: Map<string, string>,
): Product =>
  ({
    id: p._id,
    name: p.name,
    category:
      typeof p.category === "object"
        ? p.category.name
        : (categoryNames.get(p.category) ?? "—"),
    price: p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0,
    stock: p.totalStock,
  }) as Product;

export const ProductsManager = () => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(20);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // The product is not cleared on close, so the sheet keeps its content
  // while it slides out instead of blinking empty.
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const search = useDebouncedValue(query.trim(), 400);

  const list = useCursorPagination<AdminProduct, AdminProductsFilters>({
    queryKey: PRODUCTS_KEY,
    fetcher: getAdminProductsApi,
    filters: {
      search: search || undefined,
      stockStatus: filter === "all" ? undefined : filter,
    },
    limit,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: ({ signal }) => getCategoriesApi(signal),
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo(() => {
    const names = new Map(categories.map((c) => [c._id, c.name]));
    return list.items.map((p) => toProduct(p, names));
  }, [list.items, categories]);

  const handleEdit = (product: Product) => {
    // Forget any old copy so the form always opens with fresh data
    queryClient.removeQueries({ queryKey: ["admin-product", product.id] });
    setEditProduct(product);
    setEditOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);

    try {
      await deleteProductApi(deleting.id);
      toast.success(`${deleting.name} deleted.`);
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
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
              Page {list.page} · {products.length} products shown
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

        <CardContent className="space-y-4">
          {list.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-md bg-muted/50"
                />
              ))}
            </div>
          ) : list.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {getErrorMessage(list.error, "Failed to load products.")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => list.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <div
              className={
                list.isFetching ? "opacity-60 transition-opacity" : undefined
              }
            >
              <ProductsTable
                products={products}
                onEdit={handleEdit}
                onDelete={setDeleting}
              />
            </div>
          )}

          <PaginationBar
            page={list.page}
            count={products.length}
            total={list.total}
            limit={limit}
            onLimitChange={setLimit}
            hasPrev={list.hasPrev}
            hasNext={list.hasNext}
            onPrev={list.goPrev}
            onNext={list.goNext}
          />
        </CardContent>
      </Card>

      <EditProductSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        product={editProduct}
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
