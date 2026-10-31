// src/expenses/dto/create-expense.dto.ts

import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
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

export class CreateExpenseDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_EXPENSE_AMOUNT)
  amount!: number;

  // The Bangladesh day of the expense: "2026-10-31"
  @Matches(BD_DATE_PATTERN, { message: 'expenseDate must be YYYY-MM-DD' })
  expenseDate!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}
