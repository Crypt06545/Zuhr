"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LayoutGrid, Loader2, Search } from "lucide-react";

import { useProductSuggestions } from "@/hooks/useProductSuggestions";
import { formatPrice, isOutOfStock } from "@/lib/api/Products.api";

type SearchBoxProps = {
  variant: "desktop" | "mobile";
  onDone?: () => void;
};

const SearchBox = ({ variant, onDone }: SearchBoxProps) => {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const trimmed = query.trim();
  const { data, isFetching } = useProductSuggestions(query);

  const enabled = trimmed.length >= 2;
  const items = enabled ? (data ?? []) : [];
  const showPanel = open && enabled;

  // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const finish = () => {
    setQuery("");
    setOpen(false);
    setActive(-1);
    onDone?.();
  };

  const goSearch = () => {
    if (!trimmed) return;
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    finish();
  };
  
  const goProduct = (slug: string) => {
    router.push(`/products/${slug}`);
    finish();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) {
      goProduct(items[active].slug);
      return;
    }
    goSearch();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }

    if (!showPanel || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    }
  };

  const input = (
    <input
      type="search"
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setOpen(true);
        setActive(-1);
      }}
      onFocus={() => setOpen(true)}
      onKeyDown={onKeyDown}
      placeholder={
        variant === "desktop"
          ? "Search attars, oud, musk..."
          : "Search attars..."
      }
      aria-label="Search products"
      role="combobox"
      aria-expanded={showPanel}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      autoComplete="off"
      enterKeyHint="search"
      autoFocus={variant === "mobile"}
      className={
        variant === "desktop"
          ? "min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          : "w-full bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:appearance-none"
      }
    />
  );

  return (
    <form
      ref={rootRef}
      onSubmit={onSubmit}
      role="search"
      className={
        variant === "desktop"
          ? "relative hidden flex-1 items-center lg:flex"
          : "relative border-t border-border px-4 py-3 lg:hidden"
      }
    >
      {variant === "desktop" ? (
        <div className="flex w-full items-center overflow-hidden rounded-full border border-border bg-background focus-within:border-primary/50">
          <Link
            href="/products"
            className="flex shrink-0 items-center gap-2 border-r border-border px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:text-primary"
          >
            <LayoutGrid
              size={16}
              strokeWidth={1.9}
              className="text-muted-foreground"
              aria-hidden="true"
            />
            <span className="hidden xl:inline">All Categories</span>
            <span className="xl:hidden">Categories</span>
          </Link>

          {input}

          <button
            type="submit"
            className="m-1 flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Search size={15} strokeWidth={2.2} aria-hidden="true" />
            <span className="hidden xl:inline">Search</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2.5">
          <Search
            size={18}
            className="mr-2 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          {input}
          {isFetching && enabled && (
            <Loader2
              size={16}
              className="ml-2 shrink-0 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      )}

      {/* ============ Suggestions ============ */}
      {showPanel && (
        <div
          className={
            variant === "desktop"
              ? "absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
              : "absolute left-4 right-4 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          }
        >
          <ul
            id={listId}
            role="listbox"
            className="max-h-[70vh] overflow-y-auto"
          >
            {items.length === 0 && !isFetching && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No products found for &ldquo;{trimmed}&rdquo;
              </li>
            )}

            {items.length === 0 && isFetching && (
              <li className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Searching...
              </li>
            )}

            {items.map((item, index) => (
              <li
                key={item._id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => goProduct(item.slug)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === active ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {isOutOfStock(item.stockStatus)
                        ? "Out of stock"
                        : `From ${formatPrice(item.minPrice)}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};

export default SearchBox;
