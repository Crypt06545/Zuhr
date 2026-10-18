import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatPrice,
  isLowStock,
  isOutOfStock,
  type Product,
} from "@/lib/api/Products.api";

type ProductCardProps = {
  product: Product;
  eager?: boolean;
};

export const ProductCard = ({ product, eager = false }: ProductCardProps) => {
  const { variants } = product;
  const hasVariants = variants.length > 0;

  const cheapest = hasVariants
    ? variants.reduce((a, b) => (b.price < a.price ? b : a))
    : undefined;
  const maxPrice = hasVariants ? Math.max(...variants.map((v) => v.price)) : 0;
  const hasRange = !!cheapest && cheapest.price !== maxPrice;

  const discount =
    cheapest?.compareAtPrice && cheapest.compareAtPrice > cheapest.price
      ? Math.round((1 - cheapest.price / cheapest.compareAtPrice) * 100)
      : 0;

  const outOfStock = isOutOfStock(product.stockStatus);
  const lowStock = isLowStock(product.stockStatus);
  const image = product.images[0]?.url;
  const sizes = Array.from(new Set(variants.map((v) => v.size))).join(" · ");
  const href = `/products/${product.slug}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
      {/* Image */}
      <Link
        href={href}
        aria-label={product.name}
        className="relative block aspect-square overflow-hidden bg-muted outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-105",
              outOfStock && "opacity-60 grayscale",
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {discount > 0 && !outOfStock && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
              -{discount}%
            </span>
          )}
          {lowStock && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              Few left
            </span>
          )}
        </div>

        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1.5 text-center text-[12px] font-semibold text-background">
            Out of stock
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-5">
          <Link
            href={href}
            className="text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        {sizes && (
          <p className="truncate text-[12px] text-muted-foreground">{sizes}</p>
        )}

        {cheapest && (
          <div className="flex flex-wrap items-baseline gap-x-2 pt-1">
            <span className="text-[15px] font-bold text-foreground">
              {hasRange && (
                <span className="mr-1 text-[11px] font-medium text-muted-foreground">
                  From
                </span>
              )}
              {formatPrice(cheapest.price)}
            </span>
            {discount > 0 && cheapest.compareAtPrice && (
              <span className="text-[12px] text-muted-foreground line-through">
                {formatPrice(cheapest.compareAtPrice)}
              </span>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="mt-auto pt-3">
          {outOfStock ? (
            <span
              aria-disabled="true"
              className="flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-border bg-muted py-2.5 text-[13px] font-semibold text-muted-foreground"
            >
              Out of stock
            </span>
          ) : (
            <Link
              href={href}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-bold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
              <ShoppingCart size={15} aria-hidden="true" />
              Buy Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="aspect-square animate-pulse bg-muted/60" />
    <div className="space-y-2 p-3 sm:p-4">
      <div className="h-4 w-4/5 animate-pulse rounded bg-muted/60" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted/60" />
      <div className="h-5 w-1/3 animate-pulse rounded bg-muted/60" />
      <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-muted/60" />
    </div>
  </div>
);
