import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const CartEmpty = ({ onNavigate }: { onNavigate: () => void }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <ShoppingBag className="h-7 w-7" aria-hidden="true" />
    </span>
    <div>
      <p className="text-[15px] font-semibold">Your cart is empty</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Looks like you haven&apos;t added anything yet.
      </p>
    </div>
    <Link
      href="/products"
      onClick={onNavigate}
      className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
    >
      Start shopping
    </Link>
  </div>
);

export default CartEmpty;
