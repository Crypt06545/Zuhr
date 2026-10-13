// src/products/dto/create-product.dto.ts

import { plainToInstance, Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { ProductStatus } from '../schemas/product.schema.js';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

// An empty string counts as "not provided", so the SKU is auto-generated
const upperOrUndefined = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() || undefined : value;

// In multipart/form-data, arrays and objects arrive as JSON strings
export const parseJson = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value; // validation then reports "must be an array"
  }
};

export class VariantDto {
  // On edit, send the existing variant _id so its id and SKU are kept
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  size!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  color?: string;

  // Manual SKU if provided, otherwise generated from product name + size + color
  @IsOptional()
  @Transform(upperOrUndefined)
  @Matches(/^[A-Z0-9][A-Z0-9-]{1,58}[A-Z0-9]$/, {
    message: 'sku must be 3-60 chars: letters, numbers and hyphen only',
  })
  sku?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compareAtPrice?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice!: number;

  // On edit, stock of existing variants is ignored: use the stock endpoint
  @IsInt()
  @Min(0)
  stock!: number;
}

const parseVariants = (params: TransformFnParams): unknown => {
  const parsed = parseJson(params);

  return Array.isArray(parsed) ? plainToInstance(VariantDto, parsed) : parsed;
};

export class CreateProductDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  description!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsMongoId()
  category!: string;

  @Transform(parseVariants)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants!: VariantDto[];

  // At or below this total stock the product is "low stock"
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  lowStockThreshold?: number;

  @IsOptional()
  @Transform(parseJson)
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  badges?: string[];

  @IsOptional()
  @Transform(parseJson)
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
