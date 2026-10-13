// src/products/dto/query-products.dto.ts

import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { MAX_PAGE_LIMIT } from '../products.constants.js';
import { ProductStatus, StockStatus } from '../schemas/product.schema.js';

export class QueryProductsDto {
  // The previous page's nextCursor
  @IsOptional()
  @IsMongoId()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit?: number;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // true hides out_of_stock products. Implicit conversion would turn "false" into true,
  // so the raw value is checked instead
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    return obj[key] === 'true' || obj[key] === true;
  })
  @IsBoolean()
  inStock?: boolean;
}

export class AdminQueryProductsDto extends QueryProductsDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;
}
