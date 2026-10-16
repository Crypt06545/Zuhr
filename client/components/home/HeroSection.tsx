import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 lg:px-6 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Text */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground">
              <Sparkles size={13} className="text-primary" aria-hidden="true" />
              New Collection 2026
            </span>

            <h1 className="mt-5 text-[36px] font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Discover Premium <br className="hidden sm:block" />
              Products at <span className="text-primary">Unbeatable</span>{" "}
              Prices
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-[14px] leading-relaxed text-muted-foreground sm:text-[15px] lg:mx-0">
              Shop from thousands of hand-picked products across fashion,
              electronics, home &amp; lifestyle. Fast delivery, easy returns,
              24/7 support.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ShoppingBag size={16} strokeWidth={2.2} aria-hidden="true" />
                Shop Now
              </Link>
              <Link
                href="/products?sale=true"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-foreground"
              >
                View Deals
                <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </div>

            {/* Trust badges inline */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] text-muted-foreground lg:justify-start">
              <span className="flex items-center gap-1.5">
                <Truck size={14} className="text-primary" aria-hidden="true" />
                Free Shipping
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck
                  size={14}
                  className="text-primary"
                  aria-hidden="true"
                />
                Secure Payment
              </span>
              <span className="flex items-center gap-1.5">
                <RefreshCcw
                  size={14}
                  className="text-primary"
                  aria-hidden="true"
                />
                30-Day Returns
              </span>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
                <ShoppingBag
                  size={120}
                  strokeWidth={1}
                  className="text-primary/40"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Floating badge — left */}
            <div className="absolute -left-3 top-6 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:block">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Starting from
              </p>
              <p className="text-[16px] font-bold text-foreground">৳499</p>
            </div>

            {/* Floating badge — right */}
            <div className="absolute -right-3 bottom-6 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:block">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Happy Customers
              </p>
              <p className="text-[16px] font-bold text-foreground">50K+</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
