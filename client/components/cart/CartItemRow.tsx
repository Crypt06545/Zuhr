"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";

import { formatPrice } from "@/lib/api/Products.api";
import {
  MAX_QTY_PER_ITEM,
  itemKey,
  useCartStore,
  type CartItem,
} from "@/store/cart-store";

type CartItemRowProps = {
  item: CartItem;
  onNavigate: () => void;
};

// memo: একটা আইটেমের পরিমাণ বদলালে বাকি সারিগুলো আবার আঁকা হয় না
const CartItemRow = memo(function CartItemRow({
  item,
  onNavigate,
}: CartItemRowProps) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const key = itemKey(item);
  const option = [item.size, item.color].filter(Boolean).join(" / ");
  const onSale = !!item.compareAtPrice && item.compareAtPrice > item.unitPrice;
  const atMax = item.quantity >= MAX_QTY_PER_ITEM;
  const href = `/products/${item.slug}`;

  return (
    <li className="flex gap-3 py-4 sm:gap-4">
      <Link
        href={href}
        onClick={onNavigate}
        aria-label={item.name}
        className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:h-20 sm:w-20"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={href}
              onClick={onNavigate}
              className="line-clamp-2 text-[13px] font-semibold leading-5 text-foreground transition-colors hover:text-primary sm:text-[14px]"
            >
              {item.name}
            </Link>
            {option && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {option}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => removeItem(key)}
            aria-label={`Remove ${item.name} from cart`}
            className="-mr-1.5 -mt-1 shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* ছোট স্ক্রিনে পরিমাণ ও দাম এক সারিতে ধরে না হলে নিজে থেকে নিচে নামে */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
          <div
            role="group"
            aria-label={`Quantity of ${item.name}`}
            className="inline-flex items-center rounded-lg border border-border"
          >
            <button
              type="button"
              onClick={() => setQuantity(key, item.quantity - 1)}
              aria-label={
                item.quantity === 1 ? "Remove item" : "Decrease quantity"
              }
              className="flex h-9 w-9 items-center justify-center text-foreground/70 transition-colors hover:text-primary"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span
              aria-live="polite"
              className="min-w-7 px-1 text-center text-[13px] font-semibold tabular-nums"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(key, item.quantity + 1)}
              disabled={atMax}
              aria-label="Increase quantity"
              title={atMax ? `Maximum ${MAX_QTY_PER_ITEM} per item` : undefined}
              className="flex h-9 w-9 items-center justify-center text-foreground/70 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-foreground/70"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="ml-auto text-right">
            <p className="text-[15px] font-bold leading-none tabular-nums">
              {formatPrice(item.unitPrice * item.quantity)}
            </p>
            {onSale && item.compareAtPrice && (
              <p className="mt-1 text-xs text-muted-foreground line-through tabular-nums">
                {formatPrice(item.compareAtPrice * item.quantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
});

export default CartItemRow;
