import Link from "next/link";

import { formatPrice } from "@/lib/api/Products.api";
import { CHECKOUT_HREF } from "@/store/cart-store";

type CartSummaryProps = {
  subtotal: number;
  savings: number;
  onNavigate: () => void;
};

const CartSummary = ({ subtotal, savings, onNavigate }: CartSummaryProps) => (
  <footer className="space-y-3 border-t border-border bg-card px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
    {savings > 0 && (
      <div className="flex items-center justify-between text-sm text-emerald-600">
        <span>You save</span>
        <span className="font-semibold tabular-nums">
          {formatPrice(savings)}
        </span>
      </div>
    )}

    <div className="flex items-center justify-between">
      <span className="text-[15px] font-semibold">Subtotal</span>
      <span className="text-[18px] font-bold tabular-nums">
        {formatPrice(subtotal)}
      </span>
    </div>

    {/* কম উচ্চতার স্ক্রিনে (যেমন ফোন আড়াআড়ি) এই লেখা লুকায়, যেন তালিকার জায়গা থাকে */}
    <p className="hidden text-xs text-muted-foreground [@media(min-height:640px)]:block">
      Shipping, discounts and stock availability are confirmed at checkout.
    </p>

    <Link
      href={CHECKOUT_HREF}
      onClick={onNavigate}
      className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
    >
      Checkout
    </Link>
    <button
      type="button"
      onClick={onNavigate}
      className="h-10 w-full rounded-lg border border-border text-[13px] font-semibold transition-colors hover:bg-muted"
    >
      Continue shopping
    </button>
  </footer>
);

export default CartSummary;
