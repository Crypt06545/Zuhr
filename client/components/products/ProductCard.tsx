"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ImageOff, Share2, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatPrice,
  isLowStock,
  isOutOfStock,
  type Product,
} from "@/lib/api/Products.api";
import { pickDefaultVariant } from "@/lib/cart-variant";
import { MAX_QTY_PER_ITEM, useCartStore } from "@/store/cart-store";

type Rating = { average: number; count: number };

// rating এখনো backend-এ নেই, তাই এটা ঐচ্ছিক রাখা হয়েছে
type CardProduct = Product & {
  rating?: Rating;
};

type ProductCardProps = {
  product: CardProduct;
  eager?: boolean;
};

// TODO(rating): এটা নকল ডাটা, সব প্রোডাক্টে একই দেখায়।
// রিভিউ API তৈরি হলে product.rating আসবে। তখন এই ধ্রুবক আর নিচের `?? PLACEHOLDER_RATING` মুছে দাও
const PLACEHOLDER_RATING: Rating = { average: 4.5, count: 85 };

export const ProductCard = ({ product, eager = false }: ProductCardProps) => {
  const { variants, images } = product;

  const [liked, setLiked] = useState(false);
  // দ্বিতীয় ছবি প্রথম hover-এর আগে লোড হয় না, তাই অকারণে ডাটা খরচ হয় না
  const [peek, setPeek] = useState(false);

  const rating = product.rating ?? PLACEHOLDER_RATING;

  // cart-এ যে variant যায় (প্রোডাক্ট পেজের ডিফল্টের সঙ্গে একই নিয়ম), দাম ও ছাড়ও এটারই দেখাই
  const defaultVariant = pickDefaultVariant(variants);

  const discount =
    defaultVariant?.compareAtPrice &&
    defaultVariant.compareAtPrice > defaultVariant.price
      ? Math.round(
          (1 - defaultVariant.price / defaultVariant.compareAtPrice) * 100,
        )
      : 0;

  const outOfStock = isOutOfStock(product.stockStatus);
  const lowStock = isLowStock(product.stockStatus) && !outOfStock;
  const image = images[0]?.url;
  const hoverImage = images[1]?.url;
  const href = `/products/${product.slug}`;

  // cart-এ যায় productId + variantId + পরিমাণ (দেখানোর জন্য নাম-ছবি-দামও)।
  // আসল দাম ও স্টক checkout-এ সার্ভার যাচাই করে।
  // drawer নিজে থেকে খোলে না: শুধু একটা ছোট বার্তা আসে। cart দেখতে Navbar-এর আইকনে চাপতে হয়।
  const handleAddToCart = () => {
    if (!defaultVariant) return;

    const { status, quantity } = useCartStore.getState().addItem({
      productId: product._id,
      variantId: defaultVariant._id,
      name: product.name,
      slug: product.slug,
      image,
      size: defaultVariant.size,
      color: defaultVariant.color,
      unitPrice: defaultVariant.price,
      compareAtPrice: defaultVariant.compareAtPrice,
    });

    const option = [defaultVariant.size, defaultVariant.color]
      .filter(Boolean)
      .join(" / ");
    if (status === "limit") {
      toast.info(`You can add up to ${MAX_QTY_PER_ITEM} of one item.`, {
        id: "cart-feedback",
      });
      return;
    }

    // একই id: বারবার চাপলে বার্তা জমে না, আগেরটাই নতুন সংখ্যায় বদলায়
    toast.success("Added to cart", {
      id: "cart-feedback",
      description: `${product.name}${option ? ` · ${option}` : ""} (${quantity} in cart)`,
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${href}`);
      toast.success("Link copied", { description: product.name });
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <article
      onPointerEnter={() => setPeek(true)}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-3 transition-all duration-300 has-[:focus-visible]:shadow-xl hover:-translate-y-0.5 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Image */}
      <div className="relative">
        <Link
          href={href}
          aria-label={product.name}
          className="relative block aspect-square overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {image ? (
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none">
              <Image
                src={image}
                alt={product.name}
                fill
                loading={eager ? "eager" : "lazy"}
                sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className={cn(
                  "object-cover",
                  outOfStock && "opacity-60 grayscale",
                )}
              />

              {/* hover করলে দ্বিতীয় ছবি আস্তে আস্তে ফুটে ওঠে */}
              {peek && hoverImage && (
                <Image
                  src={hoverImage}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className={cn(
                    "object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none",
                    outOfStock && "grayscale",
                  )}
                />
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
              <ImageOff className="h-7 w-7" aria-hidden="true" />
              <span className="text-[11px]">Image not available</span>
            </div>
          )}

          {outOfStock && (
            <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1.5 text-center text-[12px] font-semibold text-background">
              Out of stock
            </span>
          )}
        </Link>

        {/* Top-left: badges */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {discount > 0 && !outOfStock && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
              {discount}% OFF
            </span>
          )}
          {lowStock && (
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              Few left
            </span>
          )}
        </div>

        {/* Top-right: favorite (শুধু স্ক্রিনে, কোথাও সেভ হয় না) */}
        <button
          type="button"
          onClick={() => setLiked((value) => !value)}
          aria-pressed={liked}
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          className="group/heart absolute right-0.5 top-0.5 flex h-11 w-11 items-center justify-center rounded-full outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors group-hover/heart:border-destructive/40 group-focus-visible/heart:ring-2 group-focus-visible/heart:ring-primary">
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                liked
                  ? "fill-destructive text-destructive"
                  : "text-foreground/70 group-hover/heart:text-destructive",
              )}
              aria-hidden="true"
            />
          </span>
        </button>

        {/* hover করলে বা কীবোর্ড (Tab) ফোকাসে হার্টের নিচে নেমে আসে।
            মাউস ক্লিকের ফোকাসে আটকে থাকে না, তাই মাউস সরালেই চলে যায় */}
        <div className="pointer-events-none absolute right-2.5 top-[3.25rem] flex translate-x-2 flex-col gap-2 opacity-0 transition-all duration-300 group-has-[:focus-visible]:pointer-events-auto group-has-[:focus-visible]:translate-x-0 group-has-[:focus-visible]:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none">
          <Link
            href={href}
            aria-label={`View details of ${product.name}`}
            title="View details"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm outline-none transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={handleShare}
            aria-label={`Copy link to ${product.name}`}
            title="Copy link"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm outline-none transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <h3 className="line-clamp-2 min-h-10 text-[14px] font-semibold leading-5">
          <Link
            href={href}
            className="text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1.5">
          <Stars value={rating.average} />
          <span className="text-[12px] text-muted-foreground">
            ({rating.count})
          </span>
        </div>

        {/* Price */}
        {defaultVariant && (
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[18px] font-bold leading-none text-foreground">
              {formatPrice(defaultVariant.price)}
            </span>

            {discount > 0 && defaultVariant.compareAtPrice && (
              <span className="text-[13px] text-muted-foreground line-through">
                {formatPrice(defaultVariant.compareAtPrice)}
              </span>
            )}
          </div>
        )}

        {/* Action */}
        <div className="mt-auto pt-4">
          {outOfStock ? (
            <Button
              type="button"
              disabled
              className="h-11 w-full rounded-xl text-[13px] font-bold disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
            >
              Out of stock
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={!defaultVariant}
              className="h-11 w-full gap-2 rounded-xl text-[13px] font-bold"
            >
              <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

/* ============================================================
   SMALL PIECES
   ============================================================ */

// ৫টা তারা, গড় অনুযায়ী আংশিক ভরাট (যেমন 4.5 = সাড়ে চারটা)
const Stars = ({ value }: { value: number }) => {
  const clamped = Math.min(5, Math.max(0, value));
  const slots = [0, 1, 2, 3, 4];

  return (
    <span
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
      className="relative inline-flex"
    >
      <span className="flex gap-0.5">
        {slots.map((slot) => (
          <Star
            key={slot}
            aria-hidden="true"
            className="h-3.5 w-3.5 text-muted-foreground/30"
          />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden"
        style={{ width: `${(clamped / 5) * 100}%` }}
      >
        {slots.map((slot) => (
          <Star
            key={slot}
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500"
          />
        ))}
      </span>
    </span>
  );
};

export const ProductCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-3">
    <div className="relative aspect-square animate-pulse rounded-xl bg-muted/60">
      <div className="absolute left-2.5 top-2.5 h-6 w-16 rounded-full bg-muted" />
      <div className="absolute right-2.5 top-2.5 h-9 w-9 rounded-full bg-muted" />
    </div>
    <div className="px-0.5 pt-3">
      <div className="h-4 w-4/5 animate-pulse rounded bg-muted/60" />
      <div className="mt-1.5 h-4 w-3/5 animate-pulse rounded bg-muted/60" />
      <div className="mt-3 h-3.5 w-1/2 animate-pulse rounded bg-muted/60" />
      <div className="mt-3 h-5 w-2/5 animate-pulse rounded bg-muted/60" />
      <div className="mt-4 h-11 w-full animate-pulse rounded-xl bg-muted/60" />
    </div>
  </div>
);
