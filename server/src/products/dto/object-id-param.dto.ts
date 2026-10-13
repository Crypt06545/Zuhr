// src/products/dto/object-id-param.dto.ts

import { IsMongoId } from 'class-validator';

export class ObjectIdParamDto {
  @IsMongoId()
  id!: string;
}

export class ProductVariantParamDto extends ObjectIdParamDto {
  @IsMongoId()
  variantId!: string;
}
