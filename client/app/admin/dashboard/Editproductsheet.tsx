"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getErrorMessage } from "@/hooks/use-auth";

import type { Product } from "@/lib/mock-products";
import { AddProductForm } from "./AddProductForm";
import { getAdminProductApi } from "@/lib/api/Products.api";

interface EditProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null; // the clicked table row (only its id is used)
}

export const EditProductSheet = ({
  open,
  onOpenChange,
  product,
}: EditProductSheetProps) => {
  const productId = product?.id;

  // Loads the full product (images, variants, tags...) from the backend.
  // No refetch on focus, so the form is never replaced while someone types.
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => getAdminProductApi(productId!),
    enabled: open && !!productId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 will-change-transform sm:max-w-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="px-6 pb-4 pt-6 text-left">
          <SheetTitle>Update product</SheetTitle>
          <SheetDescription>
            Change the details and save your changes.
          </SheetDescription>
        </SheetHeader>

        {isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(error, "Failed to load this product.")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </div>
        ) : isPending || !data ? (
          <div className="space-y-4 px-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-md bg-muted/50"
              />
            ))}
          </div>
        ) : (
          // The form starts with this data, so it mounts only once it has arrived
          <AddProductForm
            key={data._id}
            product={data}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
