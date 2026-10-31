// src/expenses/dto/update-expense.dto.ts

import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { BD_DATE_PATTERN, MAX_EXPENSE_AMOUNT } from '../expenses.constants.js';
import { ExpenseCategory } from '../schemas/expense.schema.js';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

// Edit an active expense. Send only what changes.
export class UpdateExpenseDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_EXPENSE_AMOUNT)
  amount?: number;

  @IsOptional()
  @Matches(BD_DATE_PATTERN, { message: 'expenseDate must be YYYY-MM-DD' })
  expenseDate?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;

  // The expense's updatedAt that the admin screen loaded. If someone else
  // changed it since, the edit is rejected instead of overwriting their work.
  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;
}
