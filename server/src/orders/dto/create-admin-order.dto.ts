
// src/orders/dto/create-admin-order.dto.ts

import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  BD_MOBILE_PATTERN,
  MAX_ORDER_LINES,
  TRANSACTION_ID_PATTERN,
} from '../orders.constants.js';
import { PaymentMethod } from '../schemas/order.schema.js';
import { OrderItemDto, ShippingAddressDto } from './create-order.dto.js';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const lowerTrim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const upperTrim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

// +8801712345678 / 8801712345678 -> 01712345678
const normalizeMobile = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().replace(/^\+?88/, '') : value;

// An admin enters an order for a customer (phone / social media order).
// Prices and stock still come from the database, never from this request.
export class CreateAdminOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ORDER_LINES)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  // The customer's name, phone and delivery address
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @IsOptional()
  @Transform(lowerTrim)
  @IsEmail()
  @MaxLength(120)
  customerEmail?: string;

  @IsOptional()
  @IsIn([PaymentMethod.COD, PaymentMethod.BKASH, PaymentMethod.NAGAD], {
    message: 'This payment method is not available yet',
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @Transform(upperTrim)
  @Matches(TRANSACTION_ID_PATTERN, {
    message: 'paymentTransactionId must be 8-12 letters or numbers',
  })
  paymentTransactionId?: string;

  @IsOptional()
  @Transform(normalizeMobile)
  @Matches(BD_MOBILE_PATTERN, {
    message: 'paymentSenderPhone must be a valid Bangladesh mobile number',
  })
  paymentSenderPhone?: string;

  // Left out = the normal delivery charge for the district
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  shippingFee?: number;

  // Advance or full payment already received (0 or left out = nothing yet)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000000)
  paidAmount?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
