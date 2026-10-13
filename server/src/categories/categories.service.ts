// src/categories/categories.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CloudinaryService } from '../common/cloudinary/cloudinary.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import {
  Product,
  type ProductDocument,
} from '../products/schemas/product.schema.js';

import { Category, type CategoryDocument } from './schemas/category.schema.js';

import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoryQueryDto } from './dto/category-query.dto.js';

const IMAGE_FOLDER = 'categories';

const CACHE_PREFIX = 'categories';
const CACHE_VERSION_KEY = 'categories:version';
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour (শুধু backstop: প্রতিটি DB বদলে version বাড়ে)
const MAX_CACHED_PAGE = 20;
const MAX_HIERARCHY_DEPTH = 50;

// slug শুধু a-z, 0-9 ও '-' হতে পারে (generateSlug তাই বানায়)। বাকি সব আগেই 404।
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;

// Public response-এ ভেতরের field যায় না
const PUBLIC_PROJECTION = '-imagePublicId -__v';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly redis: RedisService,
  ) {}

  // CREATE
  async create(dto: CreateCategoryDto, file?: Express.Multer.File) {
    const name = dto.name.trim();
    const slug = this.generateSlug(name);

    if (!slug) {
      throw new BadRequestException(
        'Category name must contain English letters or numbers',
      );
    }

    const existing = await this.categoryModel.exists({ slug });

    if (existing) {
      throw new ConflictException('Category already exists');
    }

    const parentId = dto.parentId
      ? await this.validateParentCategory(dto.parentId)
      : null;

    const uploaded = file
      ? await this.cloudinaryService.uploadImage(file, IMAGE_FOLDER)
      : null;

    let category: CategoryDocument;

    try {
      category = await this.categoryModel.create({
        name,
        slug,
        image: uploaded?.url ?? '',
        imagePublicId: uploaded?.publicId ?? '',
        parentId,
      });
    } catch (error) {
      await this.deleteImageQuietly(uploaded?.publicId);

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Category already exists');
      }

      throw error;
    }

    await this.invalidateCache();

    return category;
  }

  // FIND ALL
  async findAll(query: CategoryQueryDto) {
    const { search, parentId, rootOnly, page = 1, limit = 20 } = query;

    if (parentId && rootOnly) {
      throw new BadRequestException(
        'Use either parentId or rootOnly, not both',
      );
    }

    const loader = async () => {
      const filter: Record<string, unknown> = {};

      if (search) {
        filter.name = {
          $regex: this.escapeRegex(search),
          $options: 'i',
        };
      }

      if (parentId) {
        filter.parentId = new Types.ObjectId(parentId);
      } else if (rootOnly) {
        filter.parentId = null;
      }

      const skip = (page - 1) * limit;

      const [categories, total] = await Promise.all([
        this.categoryModel
          .find(filter)
          .select(PUBLIC_PROJECTION)
          // _id tiebreak: একই নামে page-এর সীমানায় ডুপ্লিকেট/হারানো এড়াতে
          .sort({ name: 1, _id: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        this.categoryModel.countDocuments(filter),
      ]);

      return {
        data: categories,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    };

    // search / গভীর page cache হবে না, নইলে Redis এ junk key জমবে
    if (search || page > MAX_CACHED_PAGE) {
      return loader();
    }

    const scope = parentId ?? (rootOnly ? 'root' : 'all');

    return this.cached(`list:${scope}:${page}:${limit}`, loader);
  }

  // FIND ONE
  async findOne(id: string) {
    this.validateObjectId(id);

    return this.cached(`id:${id}`, async () => {
      const category = await this.categoryModel
        .findById(id)
        .select(PUBLIC_PROJECTION)
        .lean();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    });
  }

  // FIND BY SLUG
  async findBySlug(slug: string) {
    const normalizedSlug = slug.toLowerCase().trim();

    // যে slug কখনো থাকতে পারে না, সেটা Redis বা MongoDB পর্যন্ত যায় না
    if (
      normalizedSlug.length > MAX_SLUG_LENGTH ||
      !SLUG_PATTERN.test(normalizedSlug)
    ) {
      throw new NotFoundException('Category not found');
    }

    return this.cached(`slug:${normalizedSlug}`, async () => {
      const category = await this.categoryModel
        .findOne({ slug: normalizedSlug })
        .select(PUBLIC_PROJECTION)
        .lean();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    });
  }

  // UPDATE
  async update(id: string, dto: UpdateCategoryDto, file?: Express.Multer.File) {
    this.validateObjectId(id);

    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (name !== category.name) {
        const slug = this.generateSlug(name);

        if (!slug) {
          throw new BadRequestException(
            'Category name must contain English letters or numbers',
          );
        }

        const duplicate = await this.categoryModel.exists({
          _id: { $ne: category._id },
          slug,
        });

        if (duplicate) {
          throw new ConflictException('Category already exists');
        }

        category.name = name;
        category.slug = slug;
      }
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parentId = null;
      } else {
        if (dto.parentId === id) {
          throw new BadRequestException('Category cannot be its own parent');
        }

        const parent = await this.validateParentCategory(dto.parentId);

        const circular = await this.checkCircularReference(
          id,
          parent.toString(),
        );

        if (circular) {
          throw new BadRequestException(
            'Circular category hierarchy is not allowed',
          );
        }

        category.parentId = parent;
      }
    }

    // সব validation শেষ, এখন upload (অকারণে upload হবে না)
    const oldPublicId = category.imagePublicId;
    let uploaded: { url: string; publicId: string } | null = null;

    if (file) {
      uploaded = await this.cloudinaryService.uploadImage(file, IMAGE_FOLDER);

      category.image = uploaded.url;
      category.imagePublicId = uploaded.publicId;
    }

    let saved: typeof category;

    try {
      saved = await category.save();
    } catch (error) {
      // save ব্যর্থ: শুধু এই ক্ষেত্রেই নতুন image মোছা হয়
      await this.deleteImageQuietly(uploaded?.publicId);

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Category already exists');
      }

      throw error;
    }

    // save সফল: আগে cache, তারপর পুরনো image। image মোছায় সমস্যা হলে শুধু log হয়,
    // নতুন image বা cache কিছুই নষ্ট হয় না।
    await this.invalidateCache();

    if (uploaded) {
      await this.deleteImageQuietly(oldPublicId);
    }

    return saved;
  }

  // DELETE (hard delete)
  async remove(id: string) {
    this.validateObjectId(id);

    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasChildren = await this.categoryModel.exists({
      parentId: category._id,
    });

    if (hasChildren) {
      throw new BadRequestException(
        'Cannot delete category with child categories',
      );
    }

    // product-এর category required, তাই product থাকলে মুছলে সেগুলো ঝুলে যাবে
    const hasProducts = await this.productModel.exists({
      category: category._id,
    });

    if (hasProducts) {
      throw new BadRequestException(
        'Cannot delete category that has products. Move or delete the products first',
      );
    }

    const result = await this.categoryModel.deleteOne({ _id: category._id });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Category not found');
    }

    // আগে cache, তারপর image: image মোছায় সমস্যা হলে cache পুরনো থাকে না
    await this.invalidateCache();
    await this.deleteImageQuietly(category.imagePublicId);

    return {
      message: 'Category deleted successfully',
    };
  }

  // -----------------------------
  // CACHE HELPERS
  // -----------------------------

  // key-তে version থাকে। version বাড়লে পুরনো সব key অকেজো হয়, তাই ধীর reader
  // পুরনো data এনে লিখলেও সেটা কেউ পড়ে না। Redis ব্যর্থ হলে DB থেকেই চলে (RedisService fail-open)।
  private async cached<T extends object>(
    suffix: string,
    loader: () => Promise<T>,
  ): Promise<T> {
    const version = Number(
      (await this.redis.get<number>(CACHE_VERSION_KEY)) ?? 0,
    );

    return this.redis.remember(
      `${CACHE_PREFIX}:v${version}:${suffix}`,
      CACHE_TTL_SECONDS,
      loader,
    );
  }

  private invalidateCache(): Promise<void> {
    return this.redis.incr(CACHE_VERSION_KEY);
  }

  // Cloudinary সমস্যা শুধু log হয়: আসল ফলাফল বা আসল error যেন চাপা না পড়ে
  private async deleteImageQuietly(publicId?: string | null): Promise<void> {
    if (!publicId) {
      return;
    }

    try {
      await this.cloudinaryService.deleteImage(publicId);
    } catch (error) {
      this.logger.warn(`Image cleanup failed (${publicId}): ${String(error)}`);
    }
  }

  // -----------------------------
  // HELPERS
  // -----------------------------

  private generateSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }
  }

  private async validateParentCategory(
    parentId: string,
  ): Promise<Types.ObjectId> {
    this.validateObjectId(parentId);

    const parent = await this.categoryModel.exists({
      _id: parentId,
    });

    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }

    return new Types.ObjectId(parentId);
  }

  private async checkCircularReference(
    categoryId: string,
    parentId: string,
  ): Promise<boolean> {
    let currentParentId: Types.ObjectId | null = new Types.ObjectId(parentId);
    let depth = 0;

    while (currentParentId && depth < MAX_HIERARCHY_DEPTH) {
      if (currentParentId.toString() === categoryId) {
        return true;
      }

      const parent: Pick<Category, 'parentId'> | null = await this.categoryModel
        .findById(currentParentId)
        .select('parentId')
        .lean();

      currentParentId = parent?.parentId ?? null;
      depth++;
    }

    return false;
  }
}
