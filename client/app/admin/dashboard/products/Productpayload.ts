import { AdminProductDetail, ProductStatus } from "@/lib/api/Products.api";


export const MAX_IMAGES = 5;

export const BADGE_OPTIONS = [
  "Hot Deal",
  "New Arrival",
  "Best Seller",
  "Top Rated",
  "Limited Stock",
  "Trending",
];

// The backend needs at least one variant with a size. A product without
// sizes/colors is saved as one variant named "Default"; a product with only
// colors uses "One size".
const DEFAULT_SIZE = "Default";
const ONE_SIZE = "One size";

export type FormVariant = {
  _id?: string; // set when the variant already exists on the product
  size: string | null;
  color: string | null;
  price: string;
  costPrice: string;
  stock: string;
};

export type FormValues = {
  productName: string;
  shortDescription: string;
  brand: string;
  category: string;
  price: string;
  costPrice: string;
  stock: string;
  discount: string;
  sku: string;
  lowStockThreshold: string;
  status: ProductStatus;
  badge: string;
  tags: string; // comma separated
  description: string;
  variants: FormVariant[];
};

// Quill leaves "<p><br></p>" when the editor is empty
export const isEmptyHtml = (html: string) =>
  !/<img/i.test(html) && html.replace(/<[^>]*>/g, "").trim() === "";

const isSimpleProduct = (product: AdminProductDetail) =>
  product.variants.length === 1 &&
  product.variants[0].size === DEFAULT_SIZE &&
  !product.variants[0].color;

const emptyValues: FormValues = {
  productName: "",
  shortDescription: "",
  brand: "",
  category: "",
  price: "",
  costPrice: "",
  stock: "",
  discount: "",
  sku: "",
  lowStockThreshold: "",
  status: "draft",
  badge: "none",
  tags: "",
  description: "",
  variants: [],
};

// Backend product -> the form's values (all strings, like the inputs)
export const toFormValues = (product?: AdminProductDetail): FormValues => {
  if (!product) return emptyValues;

  const first = product.variants[0];
  const simple = isSimpleProduct(product);
  const discounted = product.variants.find(
    (v) => v.compareAtPrice && v.compareAtPrice > v.price,
  );

  return {
    ...emptyValues,
    productName: product.name,
    shortDescription: product.shortDescription ?? "",
    brand: product.brand ?? "",
    category:
      typeof product.category === "object"
        ? product.category._id
        : product.category,
    price: first
      ? String(
          simple
            ? first.price
            : Math.min(...product.variants.map((v) => v.price)),
        )
      : "",
    costPrice: first ? String(first.costPrice) : "",
    stock: simple && first ? String(first.stock) : "",
    discount: discounted
      ? String(
          Math.round(
            (1 - discounted.price / discounted.compareAtPrice!) * 1000,
          ) / 10,
        )
      : "",
    sku: simple && first ? first.sku : "",
    lowStockThreshold: String(product.lowStockThreshold),
    status: product.status,
    badge: product.badges[0] ?? "none",
    tags: product.tags.join(", "),
    description: product.description,
    variants: simple
      ? []
      : product.variants.map((v) => ({
          _id: v._id,
          size: v.size === ONE_SIZE ? null : v.size,
          color: v.color ?? null,
          price: String(v.price),
          costPrice: String(v.costPrice),
          stock: String(v.stock),
        })),
  };
};

const parseTags = (value: string) => [
  ...new Set(
    value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  ),
];

export const tagsError = (value: string) => {
  const tags = parseTags(value);
  if (tags.length > 15) return "Maximum 15 tags";
  if (tags.some((t) => t.length > 30))
    return "Each tag can be 30 characters at most";
  return true;
};

interface PayloadOptions {
  hasVariants: boolean;
  files: File[];
  product?: AdminProductDetail; // set when editing
  removeImagePublicIds: string[];
}

// Builds the multipart body the backend expects, plus the stock changes that
// must be sent separately (the update endpoint ignores stock of existing variants)
export const buildProductPayload = (
  data: FormValues,
  { hasVariants, files, product, removeImagePublicIds }: PayloadOptions,
) => {
  const price = Number(data.price);
  const costPrice = Number(data.costPrice) || 0;
  const discount = Number(data.discount);

  const compareAt = (p: number) => {
    if (!(discount > 0 && discount < 100)) return undefined;
    const value = Math.round((p / ((100 - discount) / 100)) * 100) / 100;
    return value > p ? value : undefined; // the backend needs compareAtPrice > price
  };

  const simpleId =
    product && isSimpleProduct(product) ? product.variants[0]._id : undefined;

  const variants = hasVariants
    ? data.variants.map((v) => {
        const p = v.price !== "" ? Number(v.price) : price;
        return {
          _id: v._id,
          size: v.size || ONE_SIZE,
          color: v.color || undefined,
          price: p,
          costPrice: v.costPrice !== "" ? Number(v.costPrice) : costPrice,
          stock: Number(v.stock) || 0,
          compareAtPrice: compareAt(p),
        };
      })
    : [
        {
          _id: simpleId,
          size: DEFAULT_SIZE,
          sku: data.sku.trim() || undefined,
          price,
          costPrice,
          stock: Number(data.stock) || 0,
          compareAtPrice: compareAt(price),
        },
      ];

  const stockChanges = product
    ? variants.flatMap((v) => {
        if (!v._id) return [];
        const before = product.variants.find((o) => o._id === v._id);
        return before && before.stock !== v.stock
          ? [{ variantId: v._id, quantity: v.stock }]
          : [];
      })
    : [];

  // An existing variant that is not sent must be listed here on purpose
  const removeVariantIds = product
    ? product.variants
        .filter((o) => !variants.some((v) => v._id === o._id))
        .map((o) => o._id)
    : [];

  const formData = new FormData();
  formData.append("name", data.productName.trim());
  formData.append("description", data.description);
  formData.append("category", data.category);
  formData.append("status", data.status);
  formData.append("variants", JSON.stringify(variants));
  if (data.brand.trim() || product) formData.append("brand", data.brand.trim());
  if (data.shortDescription.trim() || product) {
    formData.append("shortDescription", data.shortDescription.trim());
  }
  if (data.lowStockThreshold !== "") {
    formData.append(
      "lowStockThreshold",
      String(Number(data.lowStockThreshold)),
    );
  }
  formData.append(
    "badges",
    JSON.stringify(data.badge === "none" ? [] : [data.badge]),
  );
  formData.append("tags", JSON.stringify(parseTags(data.tags)));
  files.forEach((file) => formData.append("images", file));
  if (removeImagePublicIds.length > 0) {
    formData.append(
      "removeImagePublicIds",
      JSON.stringify(removeImagePublicIds),
    );
  }
  if (removeVariantIds.length > 0) {
    formData.append("removeVariantIds", JSON.stringify(removeVariantIds));
  }

  return { formData, stockChanges };
};
