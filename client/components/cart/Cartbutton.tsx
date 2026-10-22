"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { useCartCount, useCartUi } from "@/store/cart-store";

// Navbar-এর cart বাটন: সংখ্যার ব্যাজ, আর আইটেম বাড়লে ব্যাজ একটু ফুলে ওঠে
const CartButton = () => {
  const count = useCartCount();
  const openCart = useCartUi((s) => s.openCart);

  const [bump, setBump] = useState(false);
  const previous = useRef(count);

  useEffect(() => {
    if (count > previous.current) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 250);
      previous.current = count;
      return () => clearTimeout(timer);
    }

    previous.current = count;
  }, [count]);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-haspopup="dialog"
      aria-label={`Open cart${count ? `, ${count} items` : ""}`}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:h-auto lg:w-auto lg:border-0 lg:hover:text-primary"
    >
      <ShoppingCart size={18} strokeWidth={1.9} aria-hidden="true" />
      {count > 0 && (
        <span
          className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground transition-transform duration-200 lg:-right-2 lg:-top-2 ${
            bump ? "scale-125" : "scale-100"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
};

export default CartButton;
