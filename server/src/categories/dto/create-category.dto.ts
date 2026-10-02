// src/categories/dto/create-category.dto.ts

import { Transform } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // multipart form-data তে খালি string আসতে পারে
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId()
  parentId?: string;
}
