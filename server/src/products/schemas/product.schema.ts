// src/products/schemas/product.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { DEFAULT_LOW_STOCK_THRESHOLD } from '../products.constants.js';

// Visibility: has the admin published the product?
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

// Availability: is there stock? (derived automatically from variant stock)
export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  publicId!: string;
}
export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

// Variants keep their own _id: carts and orders reference it for stock decrements
@Schema()
export class ProductVariant {
  @Prop({ required: true, trim: true })
  size!: string;

  @Prop({ type: String, trim: true })
  color?: string;

  // Auto-generated from product name + size + color, or set manually
  @Prop({ type: String, required: true, trim: true, uppercase: true })
  sku!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ type: Number, min: 0 })
  compareAtPrice?: number;

  @Prop({ required: true, min: 0 })
  costPrice!: number;

  @Prop({ required: true, min: 0, default: 0 })
  stock!: number;
}
export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true, maxlength: 150 })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: String, trim: true, maxlength: 300 })
  shortDescription?: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: String, trim: true, maxlength: 80 })
  brand?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category!: Types.ObjectId;

  @Prop({ type: [ProductImageSchema], default: [] })
  images!: ProductImage[];

  @Prop({
    type: [ProductVariantSchema],
    validate: {
      validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
      message: 'At least one variant is required',
    },
  })
  variants!: ProductVariant[];

  // totalStock <= lowStockThreshold means "low stock"
  @Prop({ type: Number, min: 0, default: DEFAULT_LOW_STOCK_THRESHOLD })
  lowStockThreshold!: number;

  // Denormalized sum of all variant stock (kept in sync by the service, used for indexing/filtering)
  @Prop({ type: Number, min: 0, default: 0 })
  totalStock!: number;

  @Prop({
    type: String,
    enum: Object.values(StockStatus),
    default: StockStatus.OUT_OF_STOCK,
  })
  stockStatus!: StockStatus;

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

// Public list: status + newest first (cursor pagination on _id)
ProductSchema.index({ status: 1, _id: -1 });
// Category filter + newest first
ProductSchema.index({ category: 1, status: 1, _id: -1 });
// Admin stock filter and stock summary counts
ProductSchema.index({ stockStatus: 1, status: 1, _id: -1 });
// SKU is globally unique across all variants
ProductSchema.index({ 'variants.sku': 1 }, { unique: true });
// Search
ProductSchema.index(
  { name: 'text', brand: 'text', tags: 'text' },
  {
    name: 'product_text',
    weights: { name: 10, brand: 5, tags: 3 },
    default_language: 'none',
  },
);
