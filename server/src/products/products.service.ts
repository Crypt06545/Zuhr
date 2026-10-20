// src/products/products.service.ts

import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type ClientSession,
  type QueryFilter as FilterQuery,
  Model,
  Types,
} from 'mongoose';

import {
  Category,
  type CategoryDocument,
} from '../categories/schemas/category.schema.js';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service.js';

import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  DEFAULT_PAGE_LIMIT,
  LIST_PROJECTION,
  MAX_PRODUCT_IMAGES,
  MAX_SLUG_LENGTH,
  PRODUCT_IMAGE_FOLDER,
  ProductSort,
  PUBLIC_PROJECTION,
  SLUG_PATTERN,
} from './products.constants.js';

import {
  Product,
  type ProductDocument,
  ProductStatus,
  type ProductVariant,
  StockStatus,
} from './schemas/product.schema.js';
import { ProductsCache } from './products.cache.js';
import { CreateProductDto, VariantDto } from './dto/create-product.dto.js';
import {
  AdminQueryProductsDto,
  QueryProductsDto,
} from './dto/query-products.dto.js';
import { computeStock } from './products.utils.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { StockUpdateType, UpdateStockDto } from './dto/update-stock.dto.js';

type LeanVariant = ProductVariant & { _id: Types.ObjectId };

type ProductLean = Omit<Product, 'variants'> & {
  _id: Types.ObjectId;
  variants: LeanVariant[];
  createdAt: Date;
  updatedAt: Date;
};

type VariantWithSku = VariantDto & { sku: string };

export interface ProductListResult {
  items: unknown[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface StockSummary {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  total: number;
}

export interface StockChangeResult {
  productId: string;
  slug: string;
  variantId: string;
  stock: number;
  totalStock: number;
  stockStatus: StockStatus;
  previousStatus: StockStatus;
}

// Server-trusted line snapshot, used by the Orders module at checkout
export interface CheckoutLine {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image?: string;
  size: string;
  color?: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly cloudinary: CloudinaryService,
    private readonly cache: ProductsCache,
  ) {}

  // ───────────────────────── Public (cached) ─────────────────────────

  findAll(query: QueryProductsDto): Promise<ProductListResult> {
    return this.cache.list(this.hashQuery(query), () =>
      this.paginate(query, { status: ProductStatus.ACTIVE }, LIST_PROJECTION),
    );
  }

  findBySlug(rawSlug: string): Promise<ProductLean> {
    const slug = rawSlug.toLowerCase();

    // A slug that can never exist must not touch Redis or MongoDB (also stops key spam)
    if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) {
      throw new NotFoundException('Product not found');
    }

    return this.cache.detail(slug, async () => {
      const product = await this.productModel
        .findOne({ slug, status: ProductStatus.ACTIVE })
        .select(PUBLIC_PROJECTION)
        .lean<ProductLean>()
        .exec();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    });
  }

  // ───────────────────────── Admin (never cached, includes costPrice) ─────────────────────────

  findAllAdmin(query: AdminQueryProductsDto): Promise<ProductListResult> {
    const base: FilterQuery<ProductDocument> = {};

    if (query.status) {
      base.status = query.status;
    }

    if (query.stockStatus) {
      base.stockStatus = query.stockStatus;
    }

    return this.paginate(query, base);
  }

  async findOneAdmin(id: string): Promise<ProductLean> {
    const product = await this.productModel
      .findById(id)
      .lean<ProductLean>()
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  getStockSummary(): Promise<StockSummary> {
    return this.cache.stockSummary(() => this.computeStockSummary());
  }

  // ───────────────────────── Create ─────────────────────────

  async create(dto: CreateProductDto, files: Express.Multer.File[] = []) {
    if (!files.length) {
      throw new BadRequestException('At least one product image is required');
    }

    this.assertVariants(dto.variants);
    await this.assertCategoryExists(dto.category);

    const resolved = await this.resolveSkus(dto.name, dto.variants);
    const variants = resolved.map((variant) =>
      this.compact({ ...variant, _id: undefined }),
    );

    const slug = await this.generateUniqueSlug(dto.name);
    const threshold = dto.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;

    const images = await this.cloudinary.uploadImages(
      files,
      PRODUCT_IMAGE_FOLDER,
    );

    let created: ProductLean;

    try {
      const doc = await this.productModel.create({
        ...dto,
        // FIX: category must be stored as an ObjectId, never as the string from the request
        category: new Types.ObjectId(dto.category),
        slug,
        images,
        variants,
        lowStockThreshold: threshold,
        minPrice: this.cheapestPrice(variants),
        ...computeStock(variants, threshold),
      });

      created = doc.toObject() as unknown as ProductLean;
    } catch (error) {
      await this.rollbackUploads(images);

      throw this.mapWriteError(error);
    }

    await this.syncCatalog(created);

    return created;
  }

  // ───────────────────────── Update ─────────────────────────

  async update(
    id: string,
    dto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ) {
    const product = await this.productModel
      .findById(id)
      .select('name slug images variants lowStockThreshold updatedAt')
      .lean<
        Pick<
          ProductLean,
          | 'name'
          | 'slug'
          | 'images'
          | 'variants'
          | 'lowStockThreshold'
          | 'updatedAt'
        >
      >()
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.category !== undefined) {
      await this.assertCategoryExists(dto.category);
    }

    const { removeImagePublicIds = [], removeVariantIds = [], ...fields } = dto;

    // Images
    const owned = new Set(product.images.map((image) => image.publicId));

    if (removeImagePublicIds.some((publicId) => !owned.has(publicId))) {
      throw new BadRequestException(
        'Some images do not belong to this product',
      );
    }

    const remaining = product.images.filter(
      (image) => !removeImagePublicIds.includes(image.publicId),
    );
    const totalImages = remaining.length + files.length;

    if (totalImages < 1) {
      throw new BadRequestException('Product must have at least one image');
    }

    if (totalImages > MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(
        `Maximum ${MAX_PRODUCT_IMAGES} images allowed`,
      );
    }

    // Variants: existing variants keep their SKU and their stock
    // (stock is changed only through the stock endpoint / orders)
    let variants: VariantWithSku[] | undefined;

    if (removeVariantIds.length && !fields.variants) {
      throw new BadRequestException(
        'removeVariantIds can only be used together with variants',
      );
    }

    if (fields.variants) {
      this.assertVariants(fields.variants);

      const existing = new Map(
        product.variants.map((variant) => [String(variant._id), variant]),
      );

      this.assertVariantChanges(fields.variants, removeVariantIds, existing);

      const resolved = await this.resolveSkus(
        fields.name ?? product.name,
        fields.variants,
        existing,
        id,
      );

      variants = resolved.map((variant) => {
        const current = variant._id ? existing.get(variant._id) : undefined;

        return current
          ? { ...variant, stock: current.stock }
          : this.compact({ ...variant, _id: undefined });
      });
    }

    const uploaded = await this.cloudinary.uploadImages(
      files,
      PRODUCT_IMAGE_FOLDER,
    );

    const changes = this.compact({
      ...fields,
      // FIX: category must be stored as an ObjectId, never as the string from the request
      category: fields.category
        ? new Types.ObjectId(fields.category)
        : undefined,
      variants,
      images: [...remaining, ...uploaded],
    });

    if (variants !== undefined || fields.lowStockThreshold !== undefined) {
      Object.assign(
        changes,
        computeStock(
          variants ?? product.variants,
          fields.lowStockThreshold ?? product.lowStockThreshold,
        ),
      );
    }

    // Cheapest variant price: price sorting reads this field
    if (variants !== undefined) {
      Object.assign(changes, { minPrice: this.cheapestPrice(variants) });
    }

    let updated: ProductLean | null;

    try {
      // Optimistic lock: fails if stock/orders touched the product meanwhile
      updated = await this.productModel
        .findOneAndUpdate(
          { _id: id, updatedAt: product.updatedAt },
          { $set: changes },
          { new: true, runValidators: true },
        )
        .lean<ProductLean>()
        .exec();
    } catch (error) {
      await this.rollbackUploads(uploaded);

      throw this.mapWriteError(error);
    }

    if (!updated) {
      await this.rollbackUploads(uploaded);

      const stillExists = await this.productModel.exists({ _id: id });

      if (!stillExists) {
        throw new NotFoundException('Product not found');
      }

      throw new ConflictException(
        'Product was changed by another request (stock or edit). Reload and try again',
      );
    }

    // DB write succeeded: invalidate the cache, then remove the old images.
    // Image cleanup problems must not turn a successful update into an error.
    await this.syncCatalog(updated);
    await this.deleteImagesQuietly(removeImagePublicIds);

    return updated;
  }

  // ───────────────────────── Stock ─────────────────────────

  async updateStock(id: string, variantId: string, dto: UpdateStockDto) {
    const result = await this.applyStockChange(id, variantId, dto);

    await this.afterStockChanged([result]);

    return result;
  }

  /**
   * Atomic stock change: variant stock, totalStock and stockStatus are updated in a
   * single operation, and the stock can never go below zero.
   * Orders must use this (ADJUST with a negative quantity), pass the transaction
   * session, and call afterStockChanged() once the transaction has committed.
   */
  async applyStockChange(
    productId: string,
    variantId: string,
    change: UpdateStockDto,
    session?: ClientSession,
  ): Promise<StockChangeResult> {
    const isSet = change.type === StockUpdateType.SET;

    if (isSet && change.quantity < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    const productObjectId = new Types.ObjectId(productId);
    const variantObjectId = new Types.ObjectId(variantId);

    // When decreasing, only match if enough stock is left
    const variantMatch: Record<string, unknown> = { _id: variantObjectId };

    if (!isSet && change.quantity < 0) {
      variantMatch.stock = { $gte: -change.quantity };
    }

    const newStock = isSet
      ? change.quantity
      : { $add: ['$$variant.stock', change.quantity] };

    const before = await this.productModel
      .findOneAndUpdate(
        { _id: productObjectId, variants: { $elemMatch: variantMatch } },
        [
          {
            $set: {
              variants: {
                $map: {
                  input: '$variants',
                  as: 'variant',
                  in: {
                    $cond: [
                      { $eq: ['$$variant._id', variantObjectId] },
                      { $mergeObjects: ['$$variant', { stock: newStock }] },
                      '$$variant',
                    ],
                  },
                },
              },
            },
          },
          { $set: { totalStock: { $sum: '$variants.stock' } } },
          {
            $set: {
              updatedAt: '$$NOW',
              stockStatus: {
                $switch: {
                  branches: [
                    {
                      case: { $lte: ['$totalStock', 0] },
                      then: StockStatus.OUT_OF_STOCK,
                    },
                    {
                      case: { $lte: ['$totalStock', '$lowStockThreshold'] },
                      then: StockStatus.LOW_STOCK,
                    },
                  ],
                  default: StockStatus.IN_STOCK,
                },
              },
            },
          },
        ],
        { new: false, session },
      )
      .select('slug variants lowStockThreshold stockStatus')
      .lean<{
        slug: string;
        variants: LeanVariant[];
        lowStockThreshold: number;
        stockStatus: StockStatus;
      }>()
      .exec();

    if (!before) {
      const exists = await this.productModel
        .exists({ _id: productObjectId, 'variants._id': variantObjectId })
        .session(session ?? null);

      if (!exists) {
        throw new NotFoundException('Product or variant not found');
      }

      throw new ConflictException('Insufficient stock for this adjustment');
    }

    const current = before.variants.find(
      (variant) => String(variant._id) === variantId,
    );
    const nextStock = isSet
      ? change.quantity
      : (current?.stock ?? 0) + change.quantity;

    const after = computeStock(
      before.variants.map((variant) =>
        String(variant._id) === variantId ? { stock: nextStock } : variant,
      ),
      before.lowStockThreshold,
    );

    return {
      productId,
      slug: before.slug,
      variantId,
      stock: nextStock,
      totalStock: after.totalStock,
      stockStatus: after.stockStatus,
      previousStatus: before.stockStatus,
    };
  }

  // Call after the DB change is committed. It only invalidates the cache (no DB read, no cache
  // write), so two overlapping stock changes can never leave old stock in Redis.
  async afterStockChanged(results: StockChangeResult[]): Promise<void> {
    if (!results.length) {
      return;
    }

    const slugs = [...new Set(results.map((result) => result.slug))];

    await Promise.all(slugs.map((slug) => this.cache.bumpDetail(slug)));

    // Lists show stockStatus, not exact stock: only a status change affects them
    if (
      results.some((result) => result.previousStatus !== result.stockStatus)
    ) {
      await this.cache.bumpLists();

      void this.warm();
    }
  }

  // Server-side price/stock lookup used by checkout (never trust client prices)
  async resolveCheckoutItems(
    items: Array<{ productId: string; variantId: string; quantity: number }>,
  ): Promise<CheckoutLine[]> {
    const ids = [...new Set(items.map((item) => item.productId))].map(
      (id) => new Types.ObjectId(id),
    );

    const products = await this.productModel
      .find({ _id: { $in: ids }, status: ProductStatus.ACTIVE })
      .select('name slug images variants')
      .lean<ProductLean[]>()
      .exec();

    const byId = new Map(products.map((p) => [String(p._id), p]));

    return items.map((item) => {
      const product = byId.get(item.productId);
      const variant = product?.variants.find(
        (v) => String(v._id) === item.variantId,
      );

      if (!product || !variant) {
        throw new BadRequestException(
          'One or more items are no longer available',
        );
      }

      if (variant.stock < item.quantity) {
        throw new ConflictException(
          `Only ${variant.stock} left for ${product.name} (${variant.size})`,
        );
      }

      return {
        productId: item.productId,
        variantId: item.variantId,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        unitPrice: variant.price,
        costPrice: variant.costPrice,
        quantity: item.quantity,
      };
    });
  }

  // ───────────────────────── Delete ─────────────────────────

  async remove(id: string) {
    const product = await this.productModel
      .findByIdAndDelete(id)
      .lean<ProductLean>()
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.invalidateCatalog(product.slug);
    void this.warm();

    await this.deleteImagesQuietly(
      product.images.map((image) => image.publicId),
    );

    return { id };
  }

  // ───────────────────────── Cache sync ─────────────────────────

  // After create / update: invalidate the detail and every list, then rebuild the hot keys.
  // Nothing is written into Redis here; readers rebuild from MongoDB, so no stale write is possible.
  private async syncCatalog(product: ProductLean): Promise<void> {
    await this.invalidateCatalog(product.slug);

    void this.warm(
      product.status === ProductStatus.ACTIVE ? [product.slug] : [],
    );
  }

  private async invalidateCatalog(slug: string): Promise<void> {
    await Promise.all([this.cache.bumpDetail(slug), this.cache.bumpLists()]);
  }

  // Rebuild the first public page, the stock summary and (optionally) changed details right away
  private async warm(slugs: string[] = []): Promise<void> {
    try {
      await Promise.all([
        this.findAll({}),
        this.getStockSummary(),
        ...slugs.map((slug) => this.findBySlug(slug)),
      ]);
    } catch {
      // Warming is best-effort; the next read will fill the cache anyway
    }
  }

  private async computeStockSummary(): Promise<StockSummary> {
    const count = (stockStatus: StockStatus) =>
      this.productModel.countDocuments({
        stockStatus,
        status: ProductStatus.ACTIVE,
      });

    const [inStock, lowStock, outOfStock] = await Promise.all([
      count(StockStatus.IN_STOCK),
      count(StockStatus.LOW_STOCK),
      count(StockStatus.OUT_OF_STOCK),
    ]);

    return {
      inStock,
      lowStock,
      outOfStock,
      total: inStock + lowStock + outOfStock,
    };
  }

  // ───────────────────────── Internals ─────────────────────────

  private async paginate(
    query: QueryProductsDto,
    base: FilterQuery<ProductDocument>,
    projection?: string,
  ): Promise<ProductListResult> {
    const limit = query.limit ?? DEFAULT_PAGE_LIMIT;
    const sort = query.sort ?? ProductSort.NEWEST;
    const byPrice = sort !== ProductSort.NEWEST;
    const priceDir = sort === ProductSort.PRICE_DESC ? -1 : 1;
    const filter: FilterQuery<ProductDocument> = { ...base };

    if (query.category) {
      filter.category = new Types.ObjectId(query.category);
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.inStock && !filter.stockStatus) {
      filter.stockStatus = { $ne: StockStatus.OUT_OF_STOCK };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const price: Record<string, number> = {};

      if (query.minPrice !== undefined) {
        price.$gte = query.minPrice;
      }

      if (query.maxPrice !== undefined) {
        price.$lte = query.maxPrice;
      }

      filter.variants = { $elemMatch: { price } };
    }

    if (query.cursor) {
      if (!byPrice) {
        if (!Types.ObjectId.isValid(query.cursor)) {
          throw new BadRequestException('Invalid cursor');
        }

        filter._id = { $lt: new Types.ObjectId(query.cursor) };
      } else {
        // Price sort cursor: "<minPrice>_<id>"
        const [rawPrice, rawId] = query.cursor.split('_');
        const price = Number(rawPrice);

        if (
          !rawPrice ||
          !Number.isFinite(price) ||
          !rawId ||
          !Types.ObjectId.isValid(rawId)
        ) {
          throw new BadRequestException('Invalid cursor');
        }

        const id = new Types.ObjectId(rawId);

        filter.$and = [
          {
            $or: [
              { minPrice: { [priceDir === 1 ? '$gt' : '$lt']: price } },
              { minPrice: price, _id: { $lt: id } },
            ],
          },
        ];
      }
    }

    const find = this.productModel.find(filter);

    if (projection) {
      find.select(projection);
    }

    // limit + 1: one extra document tells us there is another page (no count query)
    const docs = await find
      .sort(byPrice ? { minPrice: priceDir, _id: -1 } : { _id: -1 })
      .limit(limit + 1)
      .lean<ProductLean[]>()
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor:
        hasMore && last
          ? byPrice
            ? `${last.minPrice}_${String(last._id)}`
            : String(last._id)
          : null,
      hasMore,
    };
  }

  private cheapestPrice(variants: Array<{ price: number }>): number {
    return variants.length ? Math.min(...variants.map((v) => v.price)) : 0;
  }

  // product-এ ভুল বা মুছে ফেলা category ID বসতে পারবে না
  private async assertCategoryExists(categoryId: string): Promise<void> {
    const exists = await this.categoryModel.exists({ _id: categoryId });

    if (!exists) {
      throw new BadRequestException('Category not found');
    }
  }

  private assertVariants(variants: VariantDto[]): void {
    const seen = new Set<string>();

    for (const variant of variants) {
      if (
        variant.compareAtPrice !== undefined &&
        variant.compareAtPrice <= variant.price
      ) {
        throw new BadRequestException(
          `compareAtPrice must be greater than price (${variant.size})`,
        );
      }

      const key = `${variant.size}|${variant.color ?? ''}`.toLowerCase();

      if (seen.has(key)) {
        throw new BadRequestException(
          `Duplicate variant: ${variant.size} ${variant.color ?? ''}`.trim(),
        );
      }

      seen.add(key);
    }
  }

  // Existing variants are referenced by carts and orders, so they may only be removed on purpose
  private assertVariantChanges(
    sent: VariantDto[],
    removeVariantIds: string[],
    existing: Map<string, LeanVariant>,
  ): void {
    const sentIds = new Set<string>();

    for (const variant of sent) {
      if (!variant._id) {
        continue;
      }

      if (!existing.has(variant._id)) {
        throw new BadRequestException(
          `Variant ${variant._id} does not belong to this product`,
        );
      }

      if (sentIds.has(variant._id)) {
        throw new BadRequestException(`Variant sent twice: ${variant._id}`);
      }

      sentIds.add(variant._id);
    }

    for (const id of removeVariantIds) {
      if (!existing.has(id)) {
        throw new BadRequestException(
          `Variant ${id} does not belong to this product`,
        );
      }

      if (sentIds.has(id)) {
        throw new BadRequestException(
          `Variant ${id} is both updated and removed`,
        );
      }
    }

    const omitted = [...existing.keys()].filter(
      (id) => !sentIds.has(id) && !removeVariantIds.includes(id),
    );

    if (omitted.length) {
      throw new BadRequestException(
        `Existing variants must be sent with their _id (or listed in removeVariantIds to delete them): ${omitted.join(', ')}`,
      );
    }
  }

  // SKU rules:
  //  - manual SKU in the request  -> used as is (must be unique)
  //  - existing variant (_id)     -> keeps its current SKU
  //  - new variant without SKU    -> NAME-SIZE-COLOR, with a random suffix if it collides
  private async resolveSkus(
    name: string,
    variants: VariantDto[],
    existing: Map<string, LeanVariant> = new Map(),
    productId?: string,
  ): Promise<VariantWithSku[]> {
    const base = this.skuBase(name);

    const candidates = variants.map((variant) => {
      if (variant.sku) {
        return { sku: variant.sku, fixed: true };
      }

      const kept = variant._id ? existing.get(variant._id)?.sku : undefined;

      if (kept) {
        return { sku: kept, fixed: true };
      }

      const auto = [
        base,
        this.skuPart(variant.size),
        this.skuPart(variant.color),
      ]
        .filter(Boolean)
        .join('-');

      return { sku: auto, fixed: false };
    });

    const used = new Set<string>();

    for (const candidate of candidates.filter((c) => c.fixed)) {
      if (used.has(candidate.sku)) {
        throw new BadRequestException(
          `Duplicate SKU in request: ${candidate.sku}`,
        );
      }

      used.add(candidate.sku);
    }

    const taken = await this.findTakenSkus(
      candidates.map((c) => c.sku),
      productId,
    );

    for (const candidate of candidates.filter((c) => c.fixed)) {
      if (taken.has(candidate.sku)) {
        throw new ConflictException(`SKU already in use: ${candidate.sku}`);
      }
    }

    for (const candidate of candidates.filter((c) => !c.fixed)) {
      let sku = candidate.sku;

      for (
        let attempt = 0;
        attempt < 5 && (used.has(sku) || taken.has(sku));
        attempt++
      ) {
        sku = `${candidate.sku}-${randomBytes(2).toString('hex').toUpperCase()}`;

        if (!used.has(sku) && !taken.has(sku)) {
          const clash = await this.findTakenSkus([sku], productId);

          clash.forEach((value) => taken.add(value));
        }
      }

      if (used.has(sku) || taken.has(sku)) {
        throw new ConflictException(
          'Could not generate a unique SKU, please set one manually',
        );
      }

      used.add(sku);
      candidate.sku = sku;
    }

    return variants.map((variant, index) => ({
      ...variant,
      sku: candidates[index]!.sku,
    }));
  }

  private skuBase(name: string): string {
    const code = name
      .toUpperCase()
      .normalize('NFKD')
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24)
      .replace(/-+$/g, '');

    return code || 'PRD';
  }

  private skuPart(value?: string): string {
    return (value ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, '');
  }

  // SKUs from the list that already belong to another product
  private async findTakenSkus(
    skus: string[],
    excludeProductId?: string,
  ): Promise<Set<string>> {
    const filter: FilterQuery<ProductDocument> = {
      'variants.sku': { $in: skus },
    };

    if (excludeProductId) {
      filter._id = { $ne: new Types.ObjectId(excludeProductId) };
    }

    const docs = await this.productModel
      .find(filter)
      .select('variants.sku')
      .lean<Array<{ variants: Array<{ sku?: string }> }>>()
      .exec();

    const taken = new Set<string>();

    for (const doc of docs) {
      for (const variant of doc.variants) {
        if (variant.sku && skus.includes(variant.sku)) {
          taken.add(variant.sku);
        }
      }
    }

    return taken;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80)
        .replace(/-+$/g, '') || 'product';

    const taken = await this.productModel.exists({ slug: base });

    return taken ? `${base}-${randomBytes(3).toString('hex')}` : base;
  }

  private mapWriteError(error: unknown): Error {
    if (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: number }).code === 11000
    ) {
      const keys = Object.keys(
        (error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {},
      );

      if (keys.includes('variants.sku')) {
        return new ConflictException('SKU already exists');
      }

      return new ConflictException('Duplicate product, please retry');
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  private compact<T extends object>(source: T): T {
    return Object.fromEntries(
      Object.entries(source).filter(([, value]) => value !== undefined),
    ) as T;
  }

  // Cloudinary problems are logged, never thrown: they must not hide the real result or error
  private async deleteImagesQuietly(publicIds: string[]): Promise<void> {
    if (!publicIds.length) {
      return;
    }

    try {
      await this.cloudinary.deleteImages(publicIds);
    } catch (error) {
      this.logger.warn(
        `Image cleanup failed (${publicIds.join(',')}): ${String(error)}`,
      );
    }
  }

  private rollbackUploads(images: Array<{ publicId: string }>): Promise<void> {
    return this.deleteImagesQuietly(images.map((image) => image.publicId));
  }

  private hashQuery(query: QueryProductsDto): string {
    const normalized = JSON.stringify({
      c: query.cursor,
      l: query.limit ?? DEFAULT_PAGE_LIMIT,
      cat: query.category,
      s: query.search?.toLowerCase(),
      min: query.minPrice,
      max: query.maxPrice,
      in: query.inStock ?? false,
      so: query.sort ?? ProductSort.NEWEST,
    });

    return createHash('sha1').update(normalized).digest('hex');
  }
}
