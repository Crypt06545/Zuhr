// src/orders/dto/update-order.dto.ts

import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { MAX_ORDER_LINES } from '../orders.constants.js';
import { PaymentStatus } from '../schemas/order.schema.js';
import { OrderItemDto, ShippingAddressDto } from './create-order.dto.js';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

// Admin edit. Send only what changes.
export class UpdateOrderDto {
  // The complete list of lines the order should have afterwards:
  // existing lines keep their saved price, a missing line is removed,
  // a new line is priced at today's price.
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ORDER_LINES)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  shippingFee?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  adminNote?: string;

  // The order's updatedAt that the admin screen loaded. If someone else changed
  // the order since then, the edit is rejected instead of overwriting their work.
  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;
}
