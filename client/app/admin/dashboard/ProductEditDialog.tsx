"use client";

import { useState, type FormEvent } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, ProductStatus } from "@/lib/mock-products";

type Errors = Partial<Record<"name" | "category" | "price" | "stock", string>>;

interface ProductFormProps {
  product: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [errors, setErrors] = useState<Errors>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const next: Errors = {};
    const priceNum = Number(price);
    const stockNum = Number(stock);

    if (!name.trim()) next.name = "Name is required";
    if (!category.trim()) next.category = "Category is required";
    if (price.trim() === "" || !Number.isFinite(priceNum) || priceNum < 0) {
      next.price = "Enter a valid price";
    }
    if (stock.trim() === "" || !Number.isInteger(stockNum) || stockNum < 0) {
      next.stock = "Enter a whole number";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      ...product,
      name: name.trim(),
      category: category.trim(),
      price: priceNum,
      stock: stockNum,
      status,
    });
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

      <div className="space-y-2">
        <Label htmlFor="product-status">Status</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ProductStatus)}
        >
          <SelectTrigger id="product-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
};

interface ProductEditDialogProps {
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
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
    <DialogContent className="sm:max-w-md">
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
