// src/expenses/dto/query-expenses.dto.ts

import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { MAX_PAGE_LIMIT } from '../../products/products.constants.js';
import { BD_DATE_PATTERN } from '../expenses.constants.js';
import { ExpenseCategory, ExpenseStatus } from '../schemas/expense.schema.js';

export class QueryExpensesDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  // Left out = active and voided together
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  // Bangladesh days, both included: "2026-10-01" .. "2026-10-31"
  @IsOptional()
  @Matches(BD_DATE_PATTERN, { message: 'dateFrom must be YYYY-MM-DD' })
  dateFrom?: string;

  @IsOptional()
  @Matches(BD_DATE_PATTERN, { message: 'dateTo must be YYYY-MM-DD' })
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cursor?: string;
}
