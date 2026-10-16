// src/orders/dto/create-order.dto.ts

import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import {
  BD_MOBILE_PATTERN,
  MAX_LINE_QUANTITY,
  MAX_ORDER_LINES,
  TRANSACTION_ID_PATTERN,
} from '../orders.constants.js';
import { PaymentMethod } from '../schemas/order.schema.js';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const upperTrim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

// +8801712345678 / 8801712345678 -> 01712345678
const normalizeMobile = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().replace(/^\+?88/, '') : value;

const isMobilePayment = (order: CreateOrderDto): boolean =>
  order.paymentMethod === PaymentMethod.BKASH ||
  order.paymentMethod === PaymentMethod.NAGAD;

export class OrderItemDto {
  @IsMongoId()
  productId!: string;

  @IsMongoId()
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_LINE_QUANTITY)
  quantity!: number;
}

export class ShippingAddressDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @Transform(trim)
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  addressLine!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  city!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  district?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(10)
  postalCode?: string;
}

export class CreateOrderDto {
  // Only ids and quantities come from the client. Prices, names and stock
  // are always read from the database on the server.
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ORDER_LINES)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  // Card is not available yet
  @IsOptional()
  @IsEnum(PaymentMethod)
  @IsIn([PaymentMethod.COD, PaymentMethod.BKASH, PaymentMethod.NAGAD], {
    message: 'This payment method is not available yet',
  })
  paymentMethod?: PaymentMethod;

  // Required for bKash / Nagad only
  @ValidateIf(isMobilePayment)
  @Transform(upperTrim)
  @Matches(TRANSACTION_ID_PATTERN, {
    message: 'paymentTransactionId is required (8-12 letters or numbers)',
  })
  paymentTransactionId?: string;

  // The bKash / Nagad number the money was sent from
  @ValidateIf(isMobilePayment)
  @Transform(normalizeMobile)
  @Matches(BD_MOBILE_PATTERN, {
    message: 'paymentSenderPhone must be a valid Bangladesh mobile number',
  })
  paymentSenderPhone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}
