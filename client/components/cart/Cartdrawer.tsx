"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";

import { useDialogBehavior } from "@/hooks/useDialogBehavior";
import {
  CART_STORAGE_KEY,
  cartSavings,
  cartSubtotal,
  itemKey,
  useCartCount,
  useCartStore,
  useCartUi,
} from "@/store/cart-store";
import CartEmpty from "./Cartempty";
import CartItemRow from "./CartItemRow";
import CartSummary from "./Cartsummary";



const CLOSE_DELAY_MS = 320; // panel-এর বন্ধ হওয়ার অ্যানিমেশনের (300ms) একটু বেশি

/* ============================================================
   ভেতরের অংশ: শুধু drawer খোলা থাকলে আঁকা হয়
   (বন্ধ অবস্থায় কোনো ছবি লোড বা সারি আঁকা হয় না, তাই পেজ হালকা থাকে)
   ============================================================ */

const CartContent = ({ onNavigate }: { onNavigate: () => void }) => {
  const items = useCartStore((s) => s.items);

  if (items.length === 0) return <CartEmpty onNavigate={onNavigate} />;

  return (
    <>
      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain px-5">
        {items.map((item) => (
          <CartItemRow
            key={itemKey(item)}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </ul>

      <CartSummary
        subtotal={cartSubtotal(items)}
        savings={cartSavings(items)}
        onNavigate={onNavigate}
      />
    </>
  );
};

const CartTitle = () => {
  const count = useCartCount();

  return (
    <div className="flex items-center gap-2.5">
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      <h2 className="text-[16px] font-semibold">Your cart</h2>
      {count > 0 && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {count}
        </span>
      )}
    </div>
  );
};

/* ============================================================
   খোলস: portal, অ্যানিমেশন, accessibility
   ============================================================ */

const CartDrawer = () => {
  const pathname = usePathname();
  const open = useCartUi((s) => s.open);
  const closeCart = useCartUi((s) => s.closeCart);

  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // localStorage থেকে cart পড়া (SSR-এ নেই) + অন্য ট্যাবে বদলালে মিলিয়ে নেওয়া
  useEffect(() => {
    setMounted(true);
    useCartStore.persist.rehydrate();

    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) useCartStore.persist.rehydrate();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // পেজ বদলালে drawer বন্ধ
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  // বন্ধ হওয়ার অ্যানিমেশন শেষ না হওয়া পর্যন্ত ভেতরের অংশ রাখি, তারপর ফেলে দিই
  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }

    const timer = setTimeout(() => setRendered(false), CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useDialogBehavior({
    ready: mounted,
    open,
    onClose: closeCart,
    rootRef,
    panelRef,
    initialFocusRef: closeBtnRef,
  });

  // Portal: Navbar-এর backdrop-filter ভেতরের fixed উপাদানকে আটকে রাখে, তাই body-তে আঁকি
  if (!mounted) return null;

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
      className={`fixed inset-0 z-[110] transition-[visibility] duration-0 ${
        open ? "visible" : "invisible delay-300"
      }`}
    >
      {/* পর্দা: ইচ্ছা করেই blur নেই (পুরো স্ক্রিনের blur ধীর ও ভারী লাগায়) */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        ref={panelRef}
        className={`absolute bottom-0 right-0 top-0 flex w-full max-w-[420px] flex-col bg-background shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4">
          <CartTitle />
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="-mr-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {(open || rendered) && <CartContent onNavigate={closeCart} />}
      </aside>
    </div>,
    document.body,
  );
};

export default CartDrawer;
