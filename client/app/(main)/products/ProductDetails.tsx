"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/api/Products.api";
import { pickDefaultVariant } from "@/lib/cart-variant";
import {
  CHECKOUT_HREF,
  MAX_QTY_PER_ITEM,
  useCartStore,
} from "@/store/cart-store";

/* ============================================================
   TYPES (match the product returned by GET /products/:slug)
   ============================================================ */

export interface ProductDetailVariant {
  _id: string;
  size: string;
  color?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

export interface ProductDetailData {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  brand?: string;
  images: { url: string; publicId: string }[];
  variants: ProductDetailVariant[];
  lowStockThreshold: number;
  tags: string[];
}

interface ProductDetailsProps {
  product: ProductDetailData;
}

const unique = <T,>(values: T[]) => Array.from(new Set(values));

/* ============================================================
   VIEW
   ============================================================ */

export const ProductDetails = ({ product }: ProductDetailsProps) => {
  const router = useRouter();
  const { variants, images } = product;

  const [imageIndex, setImageIndex] = useState(0);
  // প্রোডাক্ট কার্ডের মতো একই ডিফল্ট variant, তাই দুই জায়গা থেকে যোগ করলে একই লাইনে মেলে
  const [variantId, setVariantId] = useState(
    () => pickDefaultVariant(variants)?._id,
  );
  const [quantity, setQuantity] = useState(1);

  const variant = variants.find((v) => v._id === variantId) ?? variants[0];

  // এই variant cart-এ এখন কতটা আছে (cart card ও এই পেজ একই store ব্যবহার করে)
  const inCart = useCartStore(
    (state) =>
      state.items.find(
        (item) =>
          item.productId === product._id && item.variantId === variant?._id,
      )?.quantity ?? 0,
  );

  const sizes = unique(variants.map((v) => v.size));
  const colors = unique(
    variants.map((v) => v.color).filter((c): c is string => !!c),
  );

  const sizeSoldOut = (size: string) =>
    variants.filter((v) => v.size === size).every((v) => v.stock <= 0);
  const colorSoldOut = (color: string) =>
    variants.filter((v) => v.color === color).every((v) => v.stock <= 0);

  const pick = (next?: ProductDetailVariant) => {
    if (!next) return;
    setVariantId(next._id);
    setQuantity(1);
  };

  const selectSize = (size: string) =>
    pick(
      variants.find((v) => v.size === size && v.color === variant?.color) ??
        variants.find((v) => v.size === size && v.stock > 0) ??
        variants.find((v) => v.size === size),
    );

  const selectColor = (color: string) =>
    pick(
      variants.find((v) => v.color === color && v.size === variant?.size) ??
        variants.find((v) => v.color === color && v.stock > 0) ??
        variants.find((v) => v.color === color),
    );

  if (!variant) {
    return (
      <main className="container mx-auto px-4 py-10 text-center text-muted-foreground">
        This product is not available right now.
      </main>
    );
  }

  const outOfStock = variant.stock <= 0;
  const lowStock = !outOfStock && variant.stock <= product.lowStockThreshold;
  const stockState: StockState = outOfStock ? "out" : lowStock ? "low" : "in";
  const stockLabel = outOfStock
    ? "Out of stock"
    : lowStock
      ? `Only ${variant.stock} left`
      : "In stock";

  // আর কতটা cart-এ যোগ করা যায়: স্টক ও প্রতি আইটেমের সীমার মধ্যে, cart-এ যা আছে তা বাদ দিয়ে
  const limit = Math.min(variant.stock, MAX_QTY_PER_ITEM);
  const remaining = Math.max(0, limit - inCart);
  const canAdd = !outOfStock && remaining > 0;
  const qty = Math.min(quantity, Math.max(1, remaining));

  const discount =
    variant.compareAtPrice && variant.compareAtPrice > variant.price
      ? Math.round((1 - variant.price / variant.compareAtPrice) * 100)
      : 0;

  const image = images[imageIndex] ?? images[0];
  const total = variant.price * qty;
  const option = [variant.size, variant.color].filter(Boolean).join(" / ");

  // দুই বাটনই এই একই কাজ করে: নির্বাচিত variant ও পরিমাণ cart store-এ যোগ
  // (product card-এর "Add to Cart"-এর মতোই; আসল দাম ও স্টক checkout-এ সার্ভার যাচাই করে)
  const addSelectedToCart = () =>
    useCartStore.getState().addItem(
      {
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        slug: product.slug,
        image: images[0]?.url,
        size: variant.size,
        color: variant.color,
        unitPrice: variant.price,
        compareAtPrice: variant.compareAtPrice,
      },
      qty,
    );

  const handleAddToCart = () => {
    if (!canAdd) return;

    const { quantity: nowInCart } = addSelectedToCart();

    setQuantity(1);
    // একই id: বারবার চাপলে বার্তা জমে না, আগেরটাই নতুন সংখ্যায় বদলায়
    toast.success("Added to cart", {
      id: "cart-feedback",
      description: `${product.name} · ${option} (${nowInCart} in cart)`,
    });
  };

  const handleBuyNow = () => {
    if (!canAdd) return;

    addSelectedToCart();
    router.push(CHECKOUT_HREF);
  };

  const optionClass = (active: boolean, soldOut: boolean) =>
    cn(
      "rounded-lg border px-4 py-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
      active
        ? "border-primary bg-primary/10 font-semibold text-primary"
        : "border-border text-foreground/70 hover:border-primary/50 hover:text-primary",
      soldOut && "text-muted-foreground line-through",
    );

  return (
    <main className="container mx-auto px-4 py-5 sm:py-6 lg:px-6 lg:py-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex min-w-0 items-center gap-2 text-[12px] text-muted-foreground sm:text-[13px]"
      >
        <Link
          href="/"
          className="shrink-0 transition-colors hover:text-primary"
        >
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/products"
          className="shrink-0 transition-colors hover:text-primary"
        >
          Products
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[500px_minmax(0,1fr)]">
        {/* ---------- Gallery ---------- */}
        <div className="mx-auto w-full min-w-0 max-w-lg space-y-3 lg:sticky lg:top-40 lg:max-w-none lg:self-start">
          {/* isolate + contain:paint = the zoomed image can never draw outside this box */}
          <div className="relative isolate aspect-square overflow-hidden rounded-2xl border border-border bg-muted [contain:paint]">
            {image ? (
              <ZoomFrame key={image.publicId}>
                <Image
                  src={image.url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 1280px) 1000px, (min-width: 1024px) 880px, (min-width: 512px) 1024px, 200vw"
                  className={cn(
                    "object-cover",
                    outOfStock && "opacity-60 grayscale",
                  )}
                />
              </ZoomFrame>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}

            {discount > 0 && !outOfStock && (
              <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-[12px] font-bold text-primary-foreground">
                -{discount}%
              </span>
            )}
          </div>

          {images.length > 1 && (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, index) => (
                <li key={img.publicId} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setImageIndex(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={index === imageIndex}
                    className={cn(
                      "relative block h-16 w-16 overflow-hidden rounded-lg border bg-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-[72px] sm:w-[72px]",
                      index === imageIndex
                        ? "border-primary"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- Info ---------- */}
        <div className="min-w-0">
          {product.brand && (
            <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
          )}

          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="mt-2 text-sm text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          {/* Price + stock */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(variant.price)}
            </span>

            {discount > 0 && variant.compareAtPrice && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(variant.compareAtPrice)}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-bold text-primary">
                  Save {formatPrice(variant.compareAtPrice - variant.price)}
                </span>
              </>
            )}

            <StockBadge state={stockState} label={stockLabel} />
          </div>

          <div className="my-6 border-t border-border" />

          {/* Color */}
          {colors.length > 1 && (
            <div className="mb-5">
              <p className="mb-2.5 text-[13px] font-semibold text-foreground">
                Color:{" "}
                <span className="font-medium text-muted-foreground">
                  {variant.color}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => selectColor(color)}
                    aria-pressed={variant.color === color}
                    className={optionClass(
                      variant.color === color,
                      colorSoldOut(color),
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {sizes.length > 1 && (
            <div className="mb-5">
              <p className="mb-2.5 text-[13px] font-semibold text-foreground">
                Size:{" "}
                <span className="font-medium text-muted-foreground">
                  {variant.size}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => selectSize(size)}
                    aria-pressed={variant.size === size}
                    className={optionClass(
                      variant.size === size,
                      sizeSoldOut(size),
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + total */}
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2.5 text-[13px] font-semibold text-foreground">
                Quantity
              </p>
              <div className="inline-flex h-12 items-center rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, qty - 1))}
                  disabled={!canAdd || qty <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-full w-12 items-center justify-center text-foreground/70 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>
                <span
                  className="w-10 text-center text-[15px] font-semibold text-foreground"
                  aria-live="polite"
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(remaining, qty + 1))}
                  disabled={!canAdd || qty >= remaining}
                  aria-label="Increase quantity"
                  className="flex h-full w-12 items-center justify-center text-foreground/70 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {qty > 1 && (
              <div className="pb-1 text-right">
                <p className="text-[12px] font-semibold text-muted-foreground">
                  Total
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatPrice(total)}
                </p>
              </div>
            )}
          </div>

          {/* Actions: দুটোই একই cart store ব্যবহার করে */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!canAdd}
              onClick={handleAddToCart}
              className="h-12 w-full min-w-0 gap-2 whitespace-nowrap px-3 text-sm font-semibold"
            >
              <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
              Add to cart
            </Button>
            <Button
              type="button"
              disabled={!canAdd}
              onClick={handleBuyNow}
              className="h-12 w-full min-w-0 gap-2 whitespace-nowrap px-3 text-sm font-semibold"
            >
              <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
              Buy now
            </Button>
          </div>

          {/* cart-এ কতটা আছে, আর সীমায় পৌঁছালে কারণ */}
          {!outOfStock && inCart > 0 && (
            <p className="mt-3 text-[13px] text-muted-foreground">
              {remaining === 0
                ? `You already have the maximum available (${inCart}) in your cart.`
                : `${inCart} of this item already in your cart.`}
            </p>
          )}

          {/* Product details table (transparent: shows the page background) */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-border">
            <h2 className="border-b border-border px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Product details
            </h2>
            <table className="w-full table-fixed text-sm">
              <tbody className="divide-y divide-border">
                <Row label="SKU" mono>
                  {variant.sku}
                </Row>
                {product.brand && <Row label="Brand">{product.brand}</Row>}
                <Row label="Size">{variant.size}</Row>
                {variant.color && <Row label="Color">{variant.color}</Row>}
                <Row label="Availability">
                  <StockBadge state={stockState} label={stockLabel} />
                </Row>
              </tbody>
            </table>
          </section>

          {product.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 text-[12px] font-medium text-foreground/70"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ---------- Description (transparent: shows the page background) ---------- */}
      {product.description && (
        <section className="relative z-10 mt-8 rounded-2xl border border-border p-5 sm:p-8 lg:mt-10">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Description
          </h2>
          <div
            className="max-w-3xl text-[14px] leading-7 text-foreground/80 [&_a]:text-primary [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}
    </main>
  );
};

/* ============================================================
   ZOOM
   ============================================================ */

const ZOOM_SCALE = 2;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

// Hover zoom for mouse/pen. Movement is written straight to the DOM (one write
// per animation frame), so there are no React re-renders while the cursor moves.
// Touch input is ignored so scrolling keeps working. will-change is only set
// while zooming, so the image is not kept on its own GPU layer all the time.
const ZoomFrame = ({ children }: { children: ReactNode }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const frameId = useRef(0);
  const zoomed = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => () => cancelAnimationFrame(frameId.current), []);

  const applyOrigin = () => {
    frameId.current = 0;

    const frame = frameRef.current;
    const layer = layerRef.current;
    if (!frame || !layer) return;

    const rect = frame.getBoundingClientRect();
    const x = clampPercent(
      ((pointer.current.x - rect.left) / rect.width) * 100,
    );
    const y = clampPercent(
      ((pointer.current.y - rect.top) / rect.height) * 100,
    );

    layer.style.transformOrigin = `${x}% ${y}%`;
  };

  const handleEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;

    const layer = layerRef.current;
    if (!layer) return;

    zoomed.current = true;

    // Set the origin first, so the zoom grows from the exact point under the cursor
    pointer.current = { x: event.clientX, y: event.clientY };
    applyOrigin();

    layer.style.willChange = "transform";
    layer.style.transform = `scale(${ZOOM_SCALE})`;
  };

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !zoomed.current) return;

    pointer.current = { x: event.clientX, y: event.clientY };

    if (!frameId.current) {
      frameId.current = requestAnimationFrame(applyOrigin);
    }
  };

  const reset = () => {
    zoomed.current = false;
    cancelAnimationFrame(frameId.current);
    frameId.current = 0;

    // Origin stays where it was, so the image zooms back out smoothly
    if (layerRef.current) {
      layerRef.current.style.transform = "scale(1)";
    }
  };

  // Release the GPU layer once the zoom-out animation has finished
  const handleTransitionEnd = () => {
    if (!zoomed.current && layerRef.current) {
      layerRef.current.style.willChange = "auto";
    }
  };

  return (
    <div
      ref={frameRef}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      className="absolute inset-0 cursor-zoom-in overflow-hidden [contain:paint]"
    >
      <div
        ref={layerRef}
        onTransitionEnd={handleTransitionEnd}
        className="absolute inset-0 transition-transform duration-200 ease-out motion-reduce:transition-none"
      >
        {children}
      </div>
    </div>
  );
};

/* ============================================================
   SMALL PIECES
   ============================================================ */

type StockState = "in" | "low" | "out";

const STOCK_STYLES: Record<StockState, { badge: string; dot: string }> = {
  in: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  low: {
    badge: "bg-amber-500/10 text-amber-600",
    dot: "bg-amber-500",
  },
  out: {
    badge: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

const StockBadge = ({ state, label }: { state: StockState; label: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
      STOCK_STYLES[state].badge,
    )}
  >
    <span
      aria-hidden="true"
      className={cn("h-1.5 w-1.5 rounded-full", STOCK_STYLES[state].dot)}
    />
    {label}
  </span>
);

const Row = ({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: ReactNode;
}) => (
  <tr>
    <th
      scope="row"
      className="w-[34%] px-5 py-3 text-left align-top text-[13px] font-medium text-muted-foreground"
    >
      {label}
    </th>
    <td
      className={cn(
        "px-5 py-3 align-top font-medium text-foreground",
        mono ? "break-all font-mono text-[12px]" : "break-words",
      )}
    >
      {children}
    </td>
  </tr>
);

export default ProductDetails;
