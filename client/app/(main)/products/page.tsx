import { Suspense } from "react";
import type { Metadata } from "next";

import { ProductCardSkeleton } from "@/components/products/ProductCard";
import ProductsView from "@/components/products/ProductsView";

export const metadata: Metadata = {
  title: "All Products | ZUHR",
  description: "Browse the entire ZUHR attar collection.",
};

// Fallback লেআউট মেইন পেজের মতো করা হয়েছে, যাতে ফিল্টার ক্লিকে লেআউট ব্রেক না হয়
const Fallback = () => (
  <main className="container mx-auto px-4 py-6 lg:px-6 lg:py-10">
    <header className="mb-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted/60" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted/60" />
    </header>
    <div className="flex gap-8">
      {/* Desktop sidebar skeleton */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-40 max-h-[calc(100dvh-11rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5 space-y-6">
          <div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted/60" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-muted/60" />
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="h-9 w-24 animate-pulse rounded bg-muted/60 lg:hidden" />
          <div className="h-9 w-32 animate-pulse rounded bg-muted/60" />
        </div>
        <div className="grid grid-cols-2 items-start gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  </main>
);

export default function ProductsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ProductsView />
    </Suspense>
  );
}
