// src/categories/dto/category-query.dto.ts

import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CategoryQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // নির্দিষ্ট parent-এর child category
  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    return obj[key] === 'true' || obj[key] === true;
  })
  @IsBoolean()
  rootOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
