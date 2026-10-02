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
import { redis } from '../redis/redis.js';

import { Category, CategoryDocument } from './schemas/category.schema.js';

import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CategoryQueryDto } from './dto/category-query.dto.js';

const IMAGE_FOLDER = 'categories';

const CACHE_PREFIX = 'categories';
const CACHE_VERSION_KEY = 'categories:version';
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const MAX_CACHED_PAGE = 20;
const MAX_HIERARCHY_DEPTH = 50;

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly cloudinaryService: CloudinaryService,
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

    // -------------------------
    // Cloudinary timing
    // -------------------------

    const uploadStart = Date.now();

    const uploaded = file
      ? await this.cloudinaryService.uploadImage(file, IMAGE_FOLDER)
      : null;

    // console.log('☁️ Cloudinary:', Date.now() - uploadStart, 'ms');

    // -------------------------
    // MongoDB timing
    // -------------------------

    const dbStart = Date.now();

    try {
      const category = await this.categoryModel.create({
        name,
        slug,
        image: uploaded?.url ?? '',
        imagePublicId: uploaded?.publicId ?? '',
        parentId,
      });

      // console.log('🍃 MongoDB:', Date.now() - dbStart, 'ms');

      // -------------------------
      // Redis timing
      // -------------------------

      const redisStart = Date.now();

      await this.invalidateCache();

      // console.log('🔴 Redis:', Date.now() - redisStart, 'ms');

      return category;
    } catch (error) {
      await this.cloudinaryService.deleteImage(uploaded?.publicId);

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Category already exists');
      }

      throw error;
    }
  }

  // FIND ALL
  async findAll(query: CategoryQueryDto) {
    const { search, parentId, page = 1, limit = 20 } = query;

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
      }

      const skip = (page - 1) * limit;

      const [categories, total] = await Promise.all([
        this.categoryModel
          .find(filter)
          .sort({ name: 1 })
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

    return this.readThrough(
      `list:${parentId ?? 'all'}:${page}:${limit}`,
      loader,
    );
  }

  // FIND ONE
  async findOne(id: string) {
    this.validateObjectId(id);

    return this.readThrough(`id:${id}`, async () => {
      const category = await this.categoryModel.findById(id).lean();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    });
  }

  // FIND BY SLUG
  async findBySlug(slug: string) {
    const normalizedSlug = slug.toLowerCase().trim();

    return this.readThrough(`slug:${normalizedSlug}`, async () => {
      const category = await this.categoryModel
        .findOne({ slug: normalizedSlug })
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

    try {
      const saved = await category.save();

      // save সফল হলেই পুরনো image মোছা হয়
      if (uploaded) {
        await this.cloudinaryService.deleteImage(oldPublicId);
      }

      await this.invalidateCache();

      return saved;
    } catch (error) {
      await this.cloudinaryService.deleteImage(uploaded?.publicId);

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Category already exists');
      }

      throw error;
    }
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

    await this.categoryModel.deleteOne({ _id: category._id });

    await this.cloudinaryService.deleteImage(category.imagePublicId);

    await this.invalidateCache();

    return {
      message: 'Category deleted successfully',
    };
  }

  // -----------------------------
  // CACHE HELPERS
  // -----------------------------

  private async getCacheVersion(): Promise<number> {
    const version = await redis.get<number>(CACHE_VERSION_KEY);

    return Number(version ?? 0);
  }

  private async readThrough<T extends object>(
    suffix: string,
    loader: () => Promise<T>,
  ): Promise<T> {
    let key: string | null = null;

    try {
      const version = await this.getCacheVersion();

      key = `${CACHE_PREFIX}:v${version}:${suffix}`;

      const hit = await redis.get<T>(key);

      if (hit) {
        return hit;
      }
    } catch (error) {
      this.logger.warn(`Cache read failed: ${String(error)}`);
    }

    // loader NotFound throw করলে কিছু cache হয় না
    const fresh = await loader();

    if (key) {
      try {
        await redis.set(key, fresh, { ex: CACHE_TTL_SECONDS });
      } catch (error) {
        this.logger.warn(`Cache write failed: ${String(error)}`);
      }
    }

    return fresh;
  }

  // version বাড়ালে পুরনো সব key এক মুহূর্তে অকেজো হয়
  private async invalidateCache(): Promise<void> {
    try {
      await redis.incr(CACHE_VERSION_KEY);
    } catch (error) {
      this.logger.error(`Cache invalidation failed: ${String(error)}`);
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
