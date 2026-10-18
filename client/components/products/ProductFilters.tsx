"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api/Categories.api";

export interface FilterPanelProps {
  categories: Category[] | null;
  categoryId?: string;
  onCategoryChange: (category: Category | null) => void;
  minPrice: string;
  maxPrice: string;
  onPriceApply: (min: string, max: string) => void;
  inStock: boolean;
  onInStockChange: (value: boolean) => void;
  onReset: () => void;
  canReset: boolean;
  hideHeader?: boolean;
}

const sectionTitle =
  "mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground";

export const FilterPanel = ({
  categories,
  categoryId,
  onCategoryChange,
  minPrice,
  maxPrice,
  onPriceApply,
  inStock,
  onInStockChange,
  onReset,
  canReset,
  hideHeader,
}: FilterPanelProps) => (
  <div className="space-y-6">
    {!hideHeader && (
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className="text-[13px] font-semibold text-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    )}

    {/* Categories */}
    <section>
      <h3 className={sectionTitle}>Categories</h3>

      {categories === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/60" />
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          <li>
            <CategoryButton
              active={!categoryId}
              onClick={() => onCategoryChange(null)}
            >
              All Products
            </CategoryButton>
          </li>
          {categories.map((category) => (
            <li key={category._id}>
              <CategoryButton
                active={categoryId === category._id}
                onClick={() => onCategoryChange(category)}
              >
                {category.name}
              </CategoryButton>
            </li>
          ))}
        </ul>
      )}
    </section>

    {/* Price */}
    <section>
      <h3 className={sectionTitle}>Price Range</h3>
      <PriceRange
        key={`${minPrice}-${maxPrice}`}
        min={minPrice}
        max={maxPrice}
        onApply={onPriceApply}
      />
    </section>

    {/* Availability */}
    <section>
      <h3 className={sectionTitle}>Availability</h3>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-[14px] font-medium text-foreground/80">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => onInStockChange(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
        />
        In stock only
      </label>
    </section>
  </div>
);

const CategoryButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "w-full rounded-lg px-3 py-2 text-left text-[14px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
      active
        ? "bg-primary/10 font-semibold text-primary"
        : "text-foreground/70 hover:bg-muted hover:text-primary",
    )}
  >
    {children}
  </button>
);

const clean = (value: string) => {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) && n >= 0
    ? String(Math.floor(n))
    : "";
};

const PriceRange = ({
  min,
  max,
  onApply,
}: {
  min: string;
  max: string;
  onApply: (min: string, max: string) => void;
}) => {
  const [low, setLow] = useState(min);
  const [high, setHigh] = useState(max);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    let a = clean(low);
    let b = clean(high);
    if (a && b && Number(a) > Number(b)) [a, b] = [b, a];
    onApply(a, b);
  };

  const inputClass =
    "w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-[16px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/50 sm:text-[13px]";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={low}
          onChange={(e) => setLow(e.target.value)}
          placeholder="Min ৳"
          aria-label="Minimum price"
          className={inputClass}
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={high}
          onChange={(e) => setHigh(e.target.value)}
          placeholder="Max ৳"
          aria-label="Maximum price"
          className={inputClass}
        />
      </div>
      <Button type="submit" size="sm" variant="outline" className="w-full">
        Apply
      </Button>
    </form>
  );
};

export const MobileFilterSheet = ({
  onClose,
  onReset,
  canReset,
  children,
}: {
  onClose: () => void;
  onReset: () => void;
  canReset: boolean;
  children: ReactNode;
}) => {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) onClose();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
      className="fixed inset-0 z-[100] lg:hidden"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">Filters</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              disabled={!canReset}
              className="text-[13px] font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Close filters"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="button" className="w-full" onClick={onClose}>
            Show results
          </Button>
        </div>
      </div>
    </div>
  );
};
