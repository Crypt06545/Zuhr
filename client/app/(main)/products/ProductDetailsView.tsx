"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { API } from "@/lib/axios";
import ProductDetails, { ProductDetailData } from "./ProductDetails";


type State =
  | { status: "loading" }
  | { status: "success"; product: ProductDetailData }
  | { status: "not-found" }
  | { status: "error"; message: string };

const errorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    return message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
};

const ProductDetailsView = () => {
  const params = useParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [state, setState] = useState<State>({ status: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();
    setState({ status: "loading" });

    API.get(`/products/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    })
      .then((res) =>
        setState({
          status: "success",
          product: (res.data?.data ?? res.data) as ProductDetailData,
        }),
      )
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setState(
          axios.isAxiosError(err) && err.response?.status === 404
            ? { status: "not-found" }
            : { status: "error", message: errorMessage(err) },
        );
      });

    return () => controller.abort();
  }, [slug, retry]);

  if (state.status === "success") {
    return <ProductDetails product={state.product} />;
  }

  if (state.status === "loading") {
    return (
      <main className="container mx-auto px-4 py-6 lg:px-6 lg:py-10">
        <div className="mb-6 h-4 w-56 animate-pulse rounded bg-muted/60" />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted/60" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted/60" />
            <div className="h-8 w-40 animate-pulse rounded bg-muted/60" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted/60" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-muted/60" />
          </div>
        </div>
      </main>
    );
  }

  const notFound = state.status === "not-found";

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <PackageSearch className="mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-bold text-foreground">
          {notFound ? "Product not found" : "Couldn't load product"}
        </h1>
        <p className="mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
          {notFound
            ? "This product doesn't exist or is no longer available."
            : state.message}
        </p>
        {notFound ? (
          <Link
            href="/products"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Back to products
          </Link>
        ) : (
          <Button type="button" onClick={() => setRetry((n) => n + 1)}>
            Try again
          </Button>
        )}
      </div>
    </main>
  );
};

export default ProductDetailsView;
