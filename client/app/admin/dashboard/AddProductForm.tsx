"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
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
import { getErrorMessage } from "@/hooks/use-auth";
import { AdminProductDetail, createProductApi, updateProductApi, updateVariantStockApi } from "@/lib/api/Products.api";
import { BADGE_OPTIONS, buildProductPayload, FormValues, isEmptyHtml, MAX_IMAGES, tagsError, toFormValues } from "./products/Productpayload";
import { getCategoriesApi } from "@/lib/api/Categories.api";



const EditorSkeleton = () => (
  <div className="h-[260px] animate-pulse rounded-md bg-muted/40" />
);

// Quill is heavy: load it as its own chunk, browser only
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

// No "image" button: the backend limits the description to 20,000 characters
// and an embedded image alone is bigger than that.
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
    ["link", "video"],
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
  "video",
  "color",
  "background",
  "align",
  "code-block",
  "script",
  "font",
  "size",
];

const MAX_DESCRIPTION = 20000;

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

const uniq = (list: (string | null)[]) => [
  ...new Set(list.filter((x): x is string => !!x)),
];

const whole = (v: string) =>
  v === "" || /^\d+$/.test(v) || "Enter a whole number";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
    <h3 className="text-sm font-semibold">{title}</h3>
    {children}
  </section>
);

const Field = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor}>
      {label}
      {required && <span className="text-red-500"> *</span>}
      {hint && (
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      )}
    </Label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

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

  if (!ready) return <EditorSkeleton />;
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

interface AddProductFormProps {
  onDone: () => void;
  product?: AdminProductDetail; // pass it to edit; leave it out to add
}

export const AddProductForm = ({ onDone, product }: AddProductFormProps) => {
  const isEdit = !!product;
  const queryClient = useQueryClient();
  const [initial] = useState(() => toFormValues(product));

  const [images, setImages] = useState<ImageItem[]>([]); // new files
  const [existingImages, setExistingImages] = useState(product?.images ?? []);
  const [imageError, setImageError] = useState("");
  const [hasVariants, setHasVariants] = useState(initial.variants.length > 0);
  const [sizes, setSizes] = useState<string[]>(() =>
    uniq(initial.variants.map((v) => v.size)),
  );
  const [sizeInput, setSizeInput] = useState("");
  const [colors, setColors] = useState<string[]>(() =>
    uniq(initial.variants.map((v) => v.color)),
  );
  const [colorInput, setColorInput] = useState("");

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getCategoriesApi,
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: initial });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const basePrice = watch("price");
  const baseCost = watch("costPrice");
  const sellsBelowCost =
    basePrice !== "" && baseCost !== "" && Number(basePrice) < Number(baseCost);

  const badgeOptions =
    initial.badge !== "none" && !BADGE_OPTIONS.includes(initial.badge)
      ? [...BADGE_OPTIONS, initial.badge]
      : BADGE_OPTIONS;

  /* ---------- save (create or update) ---------- */
  const save = useMutation({
    mutationFn: async (input: {
      formData: FormData;
      stockChanges: { variantId: string; quantity: number }[];
    }) => {
      if (!product) return createProductApi(input.formData);

      const updated = await updateProductApi(product._id, input.formData);
      for (const change of input.stockChanges) {
        await updateVariantStockApi(product._id, change.variantId, {
          type: "set",
          quantity: change.quantity,
        });
      }
      return updated;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Product updated." : "Product created.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      onDone();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          isEdit ? "Failed to update product." : "Failed to create product.",
        ),
      );
    },
  });

  const onSubmit = (data: FormValues) => {
    if (hasVariants && data.variants.length === 0) {
      toast.error("Add at least one size or color.");
      return;
    }
    if (existingImages.length + images.length < 1) {
      setImageError("Add at least one image.");
      return;
    }
    setImageError("");

    const removeImagePublicIds = (product?.images ?? [])
      .filter((img) => !existingImages.some((e) => e.publicId === img.publicId))
      .map((img) => img.publicId);

    save.mutate(
      buildProductPayload(data, {
        hasVariants,
        files: images.map((i) => i.file),
        product,
        removeImagePublicIds,
      }),
    );
  };

  /* ---------- sizes / colors ---------- */
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-8 overflow-y-auto px-6 pb-8">
        <Section title="Basic info">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Product name"
              htmlFor="productName"
              required
              error={errors.productName?.message}
            >
              <Input
                id="productName"
                placeholder="e.g. Oud Attar 12ml"
                {...register("productName", {
                  required: "Product name is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                  maxLength: { value: 150, message: "Maximum 150 characters" },
                })}
              />
            </Field>

            <Field
              label="Brand"
              htmlFor="brand"
              hint="(optional)"
              error={errors.brand?.message}
            >
              <Input
                id="brand"
                placeholder="e.g. Apple, or your own brand"
                {...register("brand", {
                  maxLength: { value: 80, message: "Maximum 80 characters" },
                })}
              />
            </Field>

            <Field
              label="Category"
              htmlFor="category"
              required
              error={
                errors.category?.message ||
                (categoriesError ? "Could not load categories." : undefined)
              }
            >
              <Controller
                name="category"
                control={control}
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue
                        placeholder={
                          categoriesLoading
                            ? "Loading categories..."
                            : "Select category"
                        }
                      />
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
            </Field>

            <Field
              label="Tags"
              htmlFor="tags"
              hint="(optional, comma separated)"
              error={errors.tags?.message}
            >
              <Input
                id="tags"
                placeholder="e.g. oud, attar, gift"
                {...register("tags", { validate: tagsError })}
              />
            </Field>
          </div>

          <Field
            label="Short description"
            htmlFor="shortDescription"
            hint="(optional, max 300 characters)"
            error={errors.shortDescription?.message}
          >
            <Input
              id="shortDescription"
              placeholder="One line shown on the product card"
              {...register("shortDescription", {
                maxLength: { value: 300, message: "Maximum 300 characters" },
              })}
            />
          </Field>
        </Section>

        <Section title="Pricing and stock">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={hasVariants ? "Base price (৳)" : "Price (৳)"}
              htmlFor="price"
              required
              hint={
                hasVariants ? "(used when a variant has no price)" : undefined
              }
              error={errors.price?.message}
            >
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="1200"
                {...register("price", {
                  required: "Price is required",
                  min: { value: 0, message: "Price cannot be negative" },
                })}
              />
            </Field>

            <Field
              label="Cost price (৳)"
              htmlFor="costPrice"
              hint="(what you paid)"
              error={errors.costPrice?.message}
            >
              <Input
                id="costPrice"
                type="number"
                inputMode="decimal"
                min={0}
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
            </Field>

            {!hasVariants && (
              <>
                <Field
                  label="Stock quantity"
                  htmlFor="stock"
                  required
                  error={errors.stock?.message}
                >
                  <Input
                    id="stock"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="25"
                    {...register("stock", {
                      validate: {
                        required: (v) => v !== "" || "Stock is required",
                        whole,
                      },
                      min: { value: 0, message: "Stock cannot be negative" },
                    })}
                  />
                </Field>

                <Field
                  label="SKU"
                  htmlFor="sku"
                  hint="(optional, made automatically if empty)"
                  error={errors.sku?.message}
                >
                  <Input
                    id="sku"
                    placeholder="OUD-12ML"
                    {...register("sku", {
                      pattern: {
                        value: /^[A-Za-z0-9][A-Za-z0-9-]{1,58}[A-Za-z0-9]$|^$/,
                        message: "3-60 characters: letters, numbers and hyphen",
                      },
                    })}
                  />
                </Field>
              </>
            )}

            <Field
              label="Low stock alert at or below"
              htmlFor="lowStockThreshold"
              hint="(default: 5)"
              error={errors.lowStockThreshold?.message}
            >
              <Input
                id="lowStockThreshold"
                type="number"
                inputMode="numeric"
                min={0}
                max={1000}
                placeholder="5"
                {...register("lowStockThreshold", {
                  validate: { whole },
                  min: { value: 0, message: "Min 0" },
                  max: { value: 1000, message: "Max 1000" },
                })}
              />
            </Field>

            <Field
              label="Discount (%)"
              htmlFor="discount"
              error={errors.discount?.message}
            >
              <Input
                id="discount"
                type="number"
                inputMode="decimal"
                min={0}
                max={99}
                step="any"
                placeholder="10"
                {...register("discount", {
                  min: { value: 0, message: "Min 0%" },
                  max: { value: 99, message: "Max 99%" },
                })}
              />
            </Field>
          </div>
        </Section>

        <Section title="Visibility">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (hidden)</SelectItem>
                      <SelectItem value="active">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Badge" htmlFor="badge">
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
            </Field>
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
                      maxLength={30}
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
                      maxLength={30}
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
                          {errors.variants?.[index]?.price?.message && (
                            <p className="text-xs text-red-500">
                              {errors.variants[index]?.price?.message}
                            </p>
                          )}
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
                          {errors.variants?.[index]?.costPrice?.message && (
                            <p className="text-xs text-red-500">
                              {errors.variants[index]?.costPrice?.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Stock <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            placeholder="0"
                            {...register(`variants.${index}.stock`, {
                              validate: {
                                required: (v) => v !== "" || "Required",
                                whole,
                              },
                              min: { value: 0, message: "Min 0" },
                            })}
                          />
                          {errors.variants?.[index]?.stock?.message && (
                            <p className="text-xs text-red-500">
                              {errors.variants[index]?.stock?.message}
                            </p>
                          )}
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
          {existingImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {existingImages.map((img, index) => (
                <div key={img.publicId} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt="Product"
                    className="h-28 w-full rounded-lg border object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setExistingImages((prev) =>
                        prev.filter((e) => e.publicId !== img.publicId),
                      )
                    }
                    aria-label="Remove image"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-destructive hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <ImageUpload
            value={images}
            onChange={(items) => {
              setImages(items);
              setImageError("");
            }}
            max={MAX_IMAGES - existingImages.length}
            error={imageError}
          />
        </Section>

        <Section title="Description">
          <Controller
            name="description"
            control={control}
            rules={{
              validate: (v) =>
                isEmptyHtml(v)
                  ? "Description is required"
                  : v.length <= MAX_DESCRIPTION ||
                    `Description is too long (${v.length}/${MAX_DESCRIPTION} characters)`,
            }}
            render={({ field }) => (
              <DescriptionEditor
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </Section>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={save.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Saving..." : "Adding..."}
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Add product"
          )}
        </Button>
      </div>
    </form>
  );
};
