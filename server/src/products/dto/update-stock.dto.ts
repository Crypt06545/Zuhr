// src/products/dto/update-stock.dto.ts

import { IsEnum, IsInt, Max, Min } from 'class-validator';

export enum StockUpdateType {
  SET = 'set', // stock = quantity
  ADJUST = 'adjust', // stock += quantity (can be negative)
}

export class UpdateStockDto {
  @IsEnum(StockUpdateType)
  type!: StockUpdateType;

  @IsInt()
  @Min(-100000)
  @Max(100000)
  quantity!: number;
}
