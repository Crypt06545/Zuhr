// src/products/dto/update-product.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

import { CreateProductDto, parseJson } from './create-product.dto.js';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // Cloudinary publicIds of the images to delete
  @IsOptional()
  @Transform(parseJson)
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  removeImagePublicIds?: string[];

  // _ids of existing variants to delete on purpose. An existing variant that is neither sent in
  // `variants` nor listed here is rejected, so a variant can never disappear by accident.
  @IsOptional()
  @Transform(parseJson)
  @IsArray()
  @ArrayMaxSize(20)
  @IsMongoId({ each: true })
  removeVariantIds?: string[];
}
