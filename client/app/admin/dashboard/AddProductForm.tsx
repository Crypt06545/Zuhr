"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { ImageIcon, Loader2, Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import "react-quill-new/dist/quill.snow.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ImageUpload,
  type ImageItem,
} from "@/components/dashboard/ImageUpload";

// Quill is heavy: load it as its own chunk, browser only
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] animate-pulse rounded-md bg-muted/40" />
  ),
});

const badgeOptions = [
  "Hot Deal",
  "New Arrival",
  "Best Seller",
  "Top Rated",
  "Limited Stock",
  "Trending",
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["blockquote", "code-block"],
    [{ script: "sub" }, { script: "super" }],
    ["link", "image", "video"],
    ["clean"],
    [{ font: [] }],
    [{ size: ["small", false, "large", "huge"] }],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "indent",
  "link",
  "image",
  "video",
  "color",
  "background",
  "align",
  "code-block",
  "script",
  "font",
  "size",
];

const MAX_IMAGES = 5;

// Placeholder categories for the design: swap with your real list later
const categories = [
  { _id: "electronics", name: "Electronics" },
  { _id: "fashion", name: "Fashion" },
  { _id: "perfume", name: "Perfume" },
  { _id: "home", name: "Home & Living" },
  { _id: "beauty", name: "Beauty" },
];

type Variant = {
  size: string | null;
  color: string | null;
  price: string;
  costPrice: string;
  stock: string;
};
type FormValues = {
  productName: string;
  brand: string;
  category: string;
  price: string;
  costPrice: string;
  lowStockThreshold: string;
  stock: string;
  discount: string;
  sku: string;
  ratingAverage: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  badge: string;
  description: string;
  variants: Variant[];
};

const buildCombos = (sizes: string[], colors: string[]) => {
  if (sizes.length && colors.length) {
    return sizes.flatMap((size) => colors.map((color) => ({ size, color })));
  }
  if (sizes.length) return sizes.map((size) => ({ size, color: null }));
  if (colors.length) return colors.map((color) => ({ size: null, color }));
  return [];
};

const comboKey = (size: string | null, color: string | null) =>
  `${size || ""}__${color || ""}`;

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
    <h3 className="text-sm font-semibold">{title}</h3>
    {children}
  </section>
);

const ErrorText = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-red-500">{message}</p> : null;

// Mounts Quill only after the sheet's slide-in animation is nearly done
const DescriptionEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return <div className="h-[260px] animate-pulse rounded-md bg-muted/40" />;
  }
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={quillModules}
      formats={quillFormats}
      placeholder="Write a detailed description..."
      className="bg-background [&_.ql-editor]:min-h-[180px]"
    />
  );
};

export const AddProductForm = ({ onDone }: { onDone: () => void }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [hasVariants, setHasVariants] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      productName: "",
      brand: "",
      category: "",
      price: "",
      costPrice: "",
      lowStockThreshold: "",
      stock: "",
      discount: "",
      sku: "",
      ratingAverage: "",
      status: "draft",
      isPublished: false,
      isFeatured: false,
      badge: "none",
      description: "",
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const basePrice = watch("price");
  const baseCost = watch("costPrice");
  const sellsBelowCost =
    basePrice !== "" && baseCost !== "" && Number(basePrice) < Number(baseCost);

  /* ---------- variants ---------- */
  const updateVariants = (newSizes: string[], newColors: string[]) => {
    const combos = buildCombos(newSizes, newColors);
    const comboKeys = combos.map((c) => comboKey(c.size, c.color));
    const current = watch("variants") || [];
    const existingKeys = current.map((v) => comboKey(v.size, v.color));

    for (let i = current.length - 1; i >= 0; i--) {
      if (!comboKeys.includes(existingKeys[i])) remove(i);
    }
    combos.forEach((c) => {
      if (!existingKeys.includes(comboKey(c.size, c.color))) {
        append({
          size: c.size,
          color: c.color,
          price: "",
          costPrice: "",
          stock: "",
        });
      }
    });
  };

  const addSize = () => {
    const value = sizeInput.trim();
    if (value && !sizes.includes(value)) {
      const next = [...sizes, value];
      setSizes(next);
      updateVariants(next, colors);
    }
    setSizeInput("");
  };
  const removeSize = (value: string) => {
    const next = sizes.filter((s) => s !== value);
    setSizes(next);
    updateVariants(next, colors);
  };
  const addColor = () => {
    const value = colorInput.trim();
    if (value && !colors.includes(value)) {
      const next = [...colors, value];
      setColors(next);
      updateVariants(sizes, next);
    }
    setColorInput("");
  };
  const removeColor = (value: string) => {
    const next = colors.filter((c) => c !== value);
    setColors(next);
    updateVariants(sizes, next);
  };
  const toggleVariants = (checked: boolean) => {
    setHasVariants(checked);
    if (!checked) {
      const current = watch("variants") || [];
      for (let i = current.length - 1; i >= 0; i--) remove(i);
      setSizes([]);
      setColors([]);
    }
  };

  /* ---------- images ---------- */
  const updateImageUrl = (index: number, value: string) =>
    setImageUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  const removeImageUrl = (index: number) =>
    setImageUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [""] : next;
    });

  /* ---------- submit (log only) ---------- */
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    const isArchived = data.status === "archived";
    const isPublished = !isArchived && data.isPublished;
    const discount = Number(data.discount);
    const compareAtPrice =
      discount > 0 && discount < 100
        ? Math.round(Number(data.price) / ((100 - discount) / 100))
        : undefined;
    const hasText =
      /<img/i.test(data.description) ||
      data.description.replace(/<[^>]*>/g, "").trim() !== "";
    const description = hasText ? data.description : "";
    const validUrls = imageUrls.map((u) => u.trim()).filter(Boolean);

    const variants = hasVariants
      ? (data.variants || []).map((v) => ({
          size: v.size || null,
          color: v.color || null,
          price: v.price ? Number(v.price) : Number(data.price),
          costPrice: v.costPrice
            ? Number(v.costPrice)
            : Number(data.costPrice) || 0,
          stock: v.stock ? Number(v.stock) : 0,
        }))
      : [];

    // Placeholder field names: match them to your NestJS DTO later
    const formData = new FormData();
    formData.append("title", data.productName);
    formData.append("description", description);
    formData.append("price", String(Number(data.price)));
    formData.append("category", data.category);
    formData.append("brand", data.brand || "");
    formData.append("sku", data.sku || "");
    formData.append("costPrice", String(Number(data.costPrice) || 0));
    if (data.lowStockThreshold !== "") {
      formData.append(
        "lowStockThreshold",
        String(Number(data.lowStockThreshold)),
      );
    }
    formData.append("hasVariants", String(hasVariants));
    formData.append("isFeatured", String(data.isFeatured));
    formData.append("badge", data.badge);
    if (data.ratingAverage !== "") {
      formData.append("ratingAverage", String(Number(data.ratingAverage)));
    }
    formData.append("isPublished", String(isPublished));
    formData.append("isArchived", String(isArchived));
    if (compareAtPrice !== undefined) {
      formData.append("compareAtPrice", String(compareAtPrice));
    }
    if (hasVariants) {
      formData.append("variants", JSON.stringify(variants));
    } else {
      formData.append("stock", String(Number(data.stock) || 0));
    }
    images.forEach((img) => formData.append("images", img.file));
    if (validUrls.length > 0) {
      formData.append("imageUrls", JSON.stringify(validUrls));
    }

    console.log("[Add product] values:", {
      ...data,
      description,
      hasVariants,
      variants,
      compareAtPrice,
      isPublished,
      isArchived,
      images: images.map((i) => i.file),
      imageUrls: validUrls,
    });
    console.table(
      images.map((i) => ({
        name: i.file.name,
        type: i.file.type,
        sizeKB: Math.round(i.file.size / 1024),
      })),
    );
    console.log("[Add product] FormData entries:", [...formData.entries()]);

    toast.success("Product logged to the console.");
    setIsSubmitting(false);
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-8 overflow-y-auto px-6 pb-8">
        <Section title="Basic info">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productName">
                Product name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                placeholder="e.g. Oud Attar 12ml"
                {...register("productName", {
                  required: "Product name is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                })}
              />
              <ErrorText message={errors.productName?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">
                Brand{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="brand"
                placeholder="e.g. Apple, or your own brand"
                {...register("brand")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <ErrorText message={errors.category?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="SKU-123456" {...register("sku")} />
            </div>
          </div>
        </Section>

        <Section title="Pricing and stock">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">
                {hasVariants ? "Base price (৳)" : "Price (৳)"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="any"
                placeholder="120000"
                {...register("price", {
                  required: "Price is required",
                  min: { value: 0, message: "Price cannot be negative" },
                })}
              />
              {hasVariants && (
                <p className="text-xs text-muted-foreground">
                  Used when a variant has no price
                </p>
              )}
              <ErrorText message={errors.price?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">
                Cost price (৳){" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (what you paid)
                </span>
              </Label>
              <Input
                id="costPrice"
                type="number"
                step="any"
                placeholder="0"
                {...register("costPrice", {
                  min: { value: 0, message: "Cost cannot be negative" },
                })}
              />
              {sellsBelowCost && (
                <p className="text-xs text-red-500">
                  Selling price is below cost, so this will sell at a loss.
                </p>
              )}
              <ErrorText message={errors.costPrice?.message} />
            </div>

            {!hasVariants && (
              <div className="space-y-2">
                <Label htmlFor="stock">
                  Stock quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="25"
                  {...register("stock", {
                    validate: (v) =>
                      hasVariants || v !== "" || "Stock is required",
                    min: { value: 0, message: "Stock cannot be negative" },
                  })}
                />
                <ErrorText message={errors.stock?.message} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">
                Low stock alert below{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (default: 5)
                </span>
              </Label>
              <Input
                id="lowStockThreshold"
                type="number"
                placeholder="5"
                {...register("lowStockThreshold", {
                  min: { value: 0, message: "Min 0" },
                })}
              />
              <ErrorText message={errors.lowStockThreshold?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                placeholder="10"
                {...register("discount", {
                  min: { value: 0, message: "Min 0%" },
                  max: { value: 100, message: "Max 100%" },
                })}
              />
              <ErrorText message={errors.discount?.message} />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="ratingAverage"
                className="flex items-center gap-1.5"
              >
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                Initial rating{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional, 0 to 5)
                </span>
              </Label>
              <Input
                id="ratingAverage"
                type="number"
                step="0.1"
                placeholder="0"
                {...register("ratingAverage", {
                  min: { value: 0, message: "Min 0" },
                  max: { value: 5, message: "Max 5" },
                })}
              />
              <ErrorText message={errors.ratingAverage?.message} />
            </div>
          </div>
        </Section>

        <Section title="Visibility">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge">Badge</Label>
              <Controller
                name="badge"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="badge" className="w-full">
                      <SelectValue placeholder="No badge" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No badge</SelectItem>
                      {badgeOptions.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isPublished"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Publish this product
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isFeatured"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="isFeatured"
                className="flex cursor-pointer items-center gap-1.5"
              >
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                Mark as featured
              </Label>
            </div>
          </div>
        </Section>

        <Section title="Sizes and colors">
          <div className="flex items-center gap-3">
            <Switch
              id="hasVariants"
              checked={hasVariants}
              onCheckedChange={toggleVariants}
            />
            <Label htmlFor="hasVariants" className="cursor-pointer">
              This product has sizes or colors
            </Label>
          </div>

          {hasVariants && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sizes (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. S, M, L or 128GB"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSize();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addSize}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {sizes.map((size) => (
                      <Badge key={size} variant="secondary" className="gap-1">
                        {size}
                        <button type="button" onClick={() => removeSize(size)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Colors (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Black, Silver"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addColor();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addColor}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {colors.map((color) => (
                      <Badge key={color} variant="secondary" className="gap-1">
                        {color}
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {fields.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <Label>Variant pricing and stock</Label>
                    <p className="text-xs text-muted-foreground">
                      Leave price blank to use the base price (৳
                      {basePrice || "0"}).
                    </p>
                  </div>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-wrap gap-2">
                        {field.size && (
                          <Badge variant="outline">{field.size}</Badge>
                        )}
                        {field.color && (
                          <Badge variant="outline">{field.color}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Price (৳)</Label>
                          <Input
                            type="number"
                            step="any"
                            placeholder={basePrice || "0"}
                            {...register(`variants.${index}.price`, {
                              min: { value: 0, message: "Min 0" },
                            })}
                          />
                          <ErrorText
                            message={errors.variants?.[index]?.price?.message}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Cost (৳)</Label>
                          <Input
                            type="number"
                            step="any"
                            placeholder={baseCost || "0"}
                            {...register(`variants.${index}.costPrice`, {
                              min: { value: 0, message: "Min 0" },
                            })}
                          />
                          <ErrorText
                            message={
                              errors.variants?.[index]?.costPrice?.message
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Stock <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            placeholder="0"
                            {...register(`variants.${index}.stock`, {
                              required: "Required",
                              min: { value: 0, message: "Min 0" },
                            })}
                          />
                          <ErrorText
                            message={errors.variants?.[index]?.stock?.message}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Section>

        <Section title={`Images (max ${MAX_IMAGES})`}>
          <ImageUpload value={images} onChange={setImages} max={MAX_IMAGES} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Or add image links</Label>
              {imageUrls.length < MAX_IMAGES - images.length && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImageUrls([...imageUrls, ""])}
                >
                  <ImageIcon className="mr-2 h-3 w-3" />
                  Add link
                </Button>
              )}
            </div>
            {imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={url}
                  onChange={(e) => updateImageUrl(index, e.target.value)}
                />
                {imageUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeImageUrl(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Description">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <DescriptionEditor
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Section>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add product"
          )}
        </Button>
      </div>
    </form>
  );
};
