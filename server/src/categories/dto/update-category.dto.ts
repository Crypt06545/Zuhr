// src/categories/dto/update-category.dto.ts

import { Transform } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  // form-data তে null পাঠানো যায় না, তাই 'null' বা '' string কে null ধরা হয়
  @IsOptional()
  @Transform(({ value }) => (value === 'null' || value === '' ? null : value))
  @IsMongoId()
  parentId?: string | null;
}
