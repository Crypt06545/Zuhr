"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PackageSearch, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchProducts,
  formatPrice,
  getErrorMessage,
  isAbortError,
  type ProductListResult,
  type SortOption,
} from "@/lib/api/Products.api";
import { type Category, getCategoriesApi } from "@/lib/api/Categories.api";
import { FilterPanel, MobileFilterSheet } from "./ProductFilters";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { PaginationBar } from "../common/Paginationbar";

/* ============================================================
   CONSTANTS
   ============================================================ */

const PAGE_SIZES = [12, 24, 48];
const EAGER_COUNT = 4;

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

const OBJECT_ID = /^[a-f\d]{24}$/i;

const parseSort = (value: string | null): SortOption =>
  value === "price_asc" || value === "price_desc" ? value : "newest";

const parsePrice = (value: string | null) => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

type FetchState = {
  status: "loading" | "success" | "error";
  data: ProductListResult | null;
  error: string | null;
};

const EMPTY_RESULT: ProductListResult = {
  items: [],
  nextCursor: null,
  hasMore: false,
};

/* ============================================================
   VIEW
   ============================================================ */

const ProductsView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* ---------- URL state ---------- */
  const search = searchParams.get("search")?.trim() ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";
  const minPrice = parsePrice(minPriceParam);
  const maxPrice = parsePrice(maxPriceParam);
  const inStock = searchParams.get("inStock") === "true";
  const sort = parseSort(searchParams.get("sort"));

  const [limit, setLimit] = useState(PAGE_SIZES[0]!);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retry, setRetry] = useState(0);

  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  /* ---------- Categories ---------- */
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getCategoriesApi(controller.signal)
      .then(setCategories)
      .catch((err) => {
        if (!isAbortError(err)) setCategories([]);
      });

    return () => controller.abort();
  }, []);

  const activeCategory = useMemo(() => {
    if (!categoryParam || !categories) return undefined;
    const key = categoryParam.toLowerCase();
    return categories.find(
      (c) =>
        c._id === categoryParam ||
        c.slug?.toLowerCase() === key ||
        c.name.toLowerCase() === key,
    );
  }, [categories, categoryParam]);

  const categoryId =
    activeCategory?._id ??
    (OBJECT_ID.test(categoryParam) ? categoryParam : undefined);

  const waitingForCategories =
    !!categoryParam && !OBJECT_ID.test(categoryParam) && categories === null;

  const unknownCategory = !!categoryParam && !!categories && !categoryId;

  /* ---------- Cursor pagination ---------- */
  const filtersKey = `${searchParams.toString()}|${limit}`;
  const [pager, setPager] = useState<{
    key: string;
    cursors: (string | undefined)[];
  }>({ key: filtersKey, cursors: [undefined] });

  const cursors = pager.key === filtersKey ? pager.cursors : [undefined];
  const page = cursors.length;
  const cursor = cursors[cursors.length - 1];

  /* ---------- Fetch ---------- */
  const [result, setResult] = useState<FetchState>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    if (waitingForCategories) return;

    if (unknownCategory) {
      setResult({ status: "success", data: EMPTY_RESULT, error: null });
      return;
    }

    const controller = new AbortController();
    setResult((prev) => ({ ...prev, status: "loading", error: null }));

    fetchProducts(
      {
        limit,
        cursor,
        category: categoryId,
        search: search || undefined,
        minPrice,
        maxPrice,
        inStock: inStock || undefined,
        sort,
      },
      controller.signal,
    )
      .then((data) => setResult({ status: "success", data, error: null }))
      .catch((err) => {
        if (isAbortError(err)) return;
        setResult((prev) => ({
          ...prev,
          status: "error",
          error: getErrorMessage(err),
        }));
      });

    return () => controller.abort();
  }, [
    waitingForCategories,
    unknownCategory,
    limit,
    cursor,
    categoryId,
    search,
    minPrice,
    maxPrice,
    inStock,
    sort,
    retry,
  ]);

  const items = result.data?.items ?? [];
  const isInitialLoading = result.status === "loading" && !result.data;
  const isFetching = result.status === "loading" && !!result.data;

  /* ---------- Actions ---------- */
  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const resetAll = () => router.push(pathname, { scroll: false });

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const goNext = () => {
    const next = result.data?.nextCursor;
    if (!next) return;
    setPager({ key: filtersKey, cursors: [...cursors, next] });
    scrollTop();
  };

  const goPrev = () => {
    if (page <= 1) return;
    setPager({ key: filtersKey, cursors: cursors.slice(0, -1) });
    scrollTop();
  };

  const canReset = !!(
    search ||
    categoryParam ||
    minPriceParam ||
    maxPriceParam ||
    inStock ||
    sort !== "newest"
  );

  const activeFilterCount =
    (categoryParam ? 1 : 0) +
    (minPriceParam || maxPriceParam ? 1 : 0) +
    (inStock ? 1 : 0);

  const filterPanelProps = {
    categories,
    categoryId,
    onCategoryChange: (category: Category | null) =>
      setParams({
        category: category ? (category.slug ?? category._id) : null,
      }),
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    onPriceApply: (min: string, max: string) =>
      setParams({ minPrice: min || null, maxPrice: max || null }),
    inStock,
    onInStockChange: (value: boolean) =>
      setParams({ inStock: value ? "true" : null }),
    onReset: resetAll,
    canReset,
  };

  /* ---------- Active chips ---------- */
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (search) {
    chips.push({
      key: "search",
      label: `Search: ${search}`,
      onRemove: () => setParams({ search: null }),
    });
  }
  if (categoryParam) {
    chips.push({
      key: "category",
      label: activeCategory?.name ?? categoryParam,
      onRemove: () => setParams({ category: null }),
    });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const label =
      minPrice !== undefined && maxPrice !== undefined
        ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
        : minPrice !== undefined
          ? `From ${formatPrice(minPrice)}`
          : `Up to ${formatPrice(maxPrice!)}`;
    chips.push({
      key: "price",
      label,
      onRemove: () => setParams({ minPrice: null, maxPrice: null }),
    });
  }
  if (inStock) {
    chips.push({
      key: "stock",
      label: "In stock",
      onRemove: () => setParams({ inStock: null }),
    });
  }

  /* ---------- Render ---------- */
  return (
    <main className="container mx-auto px-4 py-6 lg:px-6 lg:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          All Products
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse our entire collection in one place.
        </p>
      </header>

      {/* Toolbar (above both sidebar and grid) */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <p className="hidden truncate text-sm text-muted-foreground sm:block">
            {isInitialLoading
              ? "Loading products…"
              : `${items.length} product${items.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Sort by
          </span>
          <Select
            value={sort}
            onValueChange={(value) =>
              value && setParams({ sort: value === "newest" ? null : value })
            }
          >
            <SelectTrigger className="h-9 w-[185px]">
              <SelectValue>{SORT_LABELS[sort]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <SelectItem key={option} value={option}>
                  {SORT_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter chips (row is always reserved so nothing shifts) */}
      <div className="mb-4 flex min-h-[26px] flex-wrap items-center gap-2">
        {chips.length > 0 && (
          <>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {chip.label}
                <X size={12} aria-label="Remove filter" />
              </button>
            ))}
            <button
              type="button"
              onClick={resetAll}
              className="px-1 text-[12px] font-semibold text-primary"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Sidebar + grid share the same top line */}
      <div className="flex items-start gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-40 max-h-[calc(100dvh-11rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {isInitialLoading ? (
            <Grid>
              {Array.from({ length: limit > 12 ? 12 : limit }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </Grid>
          ) : result.status === "error" && !result.data ? (
            <StateBox
              title="Couldn't load products"
              text={result.error ?? "Something went wrong."}
            >
              <Button type="button" onClick={() => setRetry((n) => n + 1)}>
                Try again
              </Button>
            </StateBox>
          ) : items.length === 0 ? (
            <StateBox
              title="No products found"
              text="Try changing or clearing your filters."
            >
              {canReset && (
                <Button type="button" variant="outline" onClick={resetAll}>
                  Reset filters
                </Button>
              )}
            </StateBox>
          ) : (
            <>
              {result.status === "error" && (
                <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {result.error}{" "}
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => setRetry((n) => n + 1)}
                  >
                    Retry
                  </button>
                </p>
              )}

              <div
                className={
                  isFetching
                    ? "opacity-60 transition-opacity"
                    : "transition-opacity"
                }
                aria-busy={isFetching}
              >
                <Grid>
                  {items.map((product, index) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      eager={index < EAGER_COUNT}
                    />
                  ))}
                </Grid>
              </div>

              <div className="mt-8">
                <PaginationBar
                  page={page}
                  count={items.length}
                  limit={limit}
                  pageSizes={PAGE_SIZES}
                  onLimitChange={setLimit}
                  hasPrev={page > 1 && !isFetching}
                  hasNext={!!result.data?.hasMore && !isFetching}
                  onPrev={goPrev}
                  onNext={goNext}
                />
              </div>
            </>
          )}
        </section>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <MobileFilterSheet
          onClose={closeFilters}
          onReset={resetAll}
          canReset={canReset}
        >
          <FilterPanel {...filterPanelProps} hideHeader />
        </MobileFilterSheet>
      )}
    </main>
  );
};

/* ============================================================
   SMALL PIECES
   ============================================================ */

// items-start যোগ করা হয়েছে যাতে ১টি প্রোডাক্ট থাকলে কার্ড stretch না হয়ে ফাঁকা জায়গা তৈরি করে
const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 items-start gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
    {children}
  </div>
);

const StateBox = ({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
    <PackageSearch className="mb-4 h-10 w-10 text-muted-foreground" />
    <h2 className="text-lg font-bold text-foreground">{title}</h2>
    <p className="mt-1 mb-5 max-w-sm text-sm text-muted-foreground">{text}</p>
    {children}
  </div>
);

export default ProductsView;
