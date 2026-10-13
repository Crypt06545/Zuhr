"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { FieldError } from "@/components/common/FieldError";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/lib/mock-products";
import {
  getStockState,
  LOW_STOCK_THRESHOLD,
  StockBadge,
} from "./ProductStatusBadge";

type Errors = Partial<Record<"name" | "category" | "price" | "stock", string>>;

interface ProductFormProps {
  product: Product;
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
}

const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);

  const stockNum = Number(stock);
  const stockValid =
    stock.trim() !== "" && Number.isInteger(stockNum) && stockNum >= 0;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    const next: Errors = {};
    const priceNum = Number(price);

    if (!name.trim()) next.name = "Name is required";
    if (!category.trim()) next.category = "Category is required";
    if (price.trim() === "" || !Number.isFinite(priceNum) || priceNum < 0) {
      next.price = "Enter a valid price";
    }
    if (!stockValid) next.stock = "Enter a whole number";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);
    try {
      await onSave({
        ...product,
        name: name.trim(),
        category: category.trim(),
        price: priceNum,
        stock: stockNum,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product-name">Name</Label>
        <Input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-category">Category</Label>
        <Input
          id="product-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-invalid={!!errors.category}
        />
        <FieldError message={errors.category} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-price">Price (BDT)</Label>
          <Input
            id="product-price"
            type="number"
            inputMode="decimal"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={!!errors.price}
          />
          <FieldError message={errors.price} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-stock">Stock</Label>
          <Input
            id="product-stock"
            type="number"
            inputMode="numeric"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            aria-invalid={!!errors.stock}
          />
          <FieldError message={errors.stock} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium">Stock status</p>
          <p className="text-xs text-muted-foreground">
            Low stock at {LOW_STOCK_THRESHOLD} or fewer
          </p>
        </div>
        {stockValid && <StockBadge state={getStockState(stockNum)} />}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface ProductEditDialogProps {
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
}

export const ProductEditDialog = ({
  product,
  onClose,
  onSave,
}: ProductEditDialogProps) => (
  <Dialog
    open={product !== null}
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  >
    <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit product</DialogTitle>
        <DialogDescription>
          Update the details and save your changes.
        </DialogDescription>
      </DialogHeader>
      {product && (
        <ProductForm
          key={product.id}
          product={product}
          onSave={onSave}
          onCancel={onClose}
        />
      )}
    </DialogContent>
  </Dialog>
);
