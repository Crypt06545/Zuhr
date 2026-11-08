// src/products/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

@Schema({ _id: false })
export class ProductImage {
  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: String, required: true })
  publicId!: string;
}

// Eta-i crash fix: class na, schema ta array te dite hoy
export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

// Variant er _id auto toiri hoy (cart / order eta diye variant chine)
@Schema()
export class ProductVariant {
  @Prop({ type: String, required: true, trim: true })
  size!: string;

  @Prop({ type: String, trim: true })
  color?: string;

  @Prop({ type: String, required: true, trim: true })
  sku!: string;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: Number, min: 0 })
  compareAtPrice?: number;

  @Prop({ type: Number, required: true, min: 0 })
  costPrice!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  stock!: number;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  slug!: string;

  @Prop({ type: String, trim: true })
  shortDescription?: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: String, trim: true })
  brand?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  category!: Types.ObjectId;

  @Prop({ type: [ProductImageSchema], default: [] })
  images!: ProductImage[];

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants!: ProductVariant[];

  @Prop({ type: Number, min: 0, default: 5 })
  lowStockThreshold!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  totalStock!: number;

  @Prop({
    type: String,
    enum: Object.values(StockStatus),
    default: StockStatus.OUT_OF_STOCK,
  })
  stockStatus!: StockStatus;

  // Sabcheye sosta variant er dam. Price sort ei field diye hoy
  @Prop({ type: Number, min: 0, default: 0 })
  minPrice!: number;

  // Search bar: name + brand-er prottek shobdo lowercase e ("Blue Shirt" -> ["blue","shirt"])
  @Prop({ type: [String], default: [], select: false })
  searchTokens!: string[];

  @Prop({ type: [String], default: [] })
  badges!: string[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.DRAFT,
  })
  status!: ProductStatus;
}

export type ProductDocument = HydratedDocument<Product>;

export const ProductSchema = SchemaFactory.createForClass(Product);

// Full search ($text)
ProductSchema.index({
  name: 'text',
  brand: 'text',
  shortDescription: 'text',
  tags: 'text',
});

// Search bar suggestion (prefix)
ProductSchema.index({ status: 1, searchTokens: 1 });

// SKU unique (create / update e conflict check er jonno)
ProductSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });

// Public list: newest
ProductSchema.index({ status: 1, _id: -1 });

// Public list: category + newest
ProductSchema.index({ status: 1, category: 1, _id: -1 });

// Public list: price sort + cursor
ProductSchema.index({ status: 1, minPrice: 1, _id: -1 });

// Admin stock filter
ProductSchema.index({ stockStatus: 1, _id: -1 });

// Stock summary
ProductSchema.index({ status: 1, stockStatus: 1 });
