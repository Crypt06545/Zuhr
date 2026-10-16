// src/orders/dto/query-orders.dto.ts

import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { MAX_PAGE_LIMIT } from '../../products/products.constants.js';
import { OrderStatus, PaymentStatus } from '../schemas/order.schema.js';

export class QueryMyOrdersDto {
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
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class AdminQueryOrdersDto extends QueryMyOrdersDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  // Order number, phone or email: the beginning of it is enough
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  // 2026-10-01 or a full ISO date. dateTo includes the whole day if only a date is sent.
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
