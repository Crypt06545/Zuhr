// src/expenses/dto/void-expense.dto.ts

import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class VoidExpenseDto {
  // A reason is required, so the audit trail always says why
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason!: string;
}
