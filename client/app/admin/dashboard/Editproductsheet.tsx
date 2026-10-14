"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Product } from "@/lib/mock-products";
import { AddProductForm, type ProductInitialValues } from "./AddProductForm";

// Turns the clicked product row into the form's values (all strings).
// Fields the list doesn't have (brand, sku, variants, images...) stay empty.
const toFormValues = (product: Product): ProductInitialValues => ({
  productName: product.name,
  category: product.category,
  price: String(product.price),
  stock: String(product.stock),
});

// TODO: when the API is ready, fetch the full product by product.id here
// and map every field with toFormValues. Keep the { data, isLoading } shape
// and nothing else in this file or the form has to change.
const useProductForEdit = (product: Product | null) => {
  return {
    data: product ? toFormValues(product) : undefined,
    isLoading: false,
  };
};

interface EditProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export const EditProductSheet = ({
  open,
  onOpenChange,
  product,
}: EditProductSheetProps) => {
  const { data, isLoading } = useProductForEdit(product);

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

        {isLoading || !data ? (
          <div className="space-y-4 px-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-md bg-muted/50"
              />
            ))}
          </div>
        ) : (
          // The form starts with `data` as its values, so it mounts only once
          // the data is ready. A new key resets it for another product.
          <AddProductForm
            key={product?.id}
            mode="edit"
            initialValues={data}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
