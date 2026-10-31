// src/finance/dto/finance-query.dto.ts

import { IsOptional, Matches } from 'class-validator';

import { BD_DATE_PATTERN } from '../../expenses/expenses.constants.js';

// Bangladesh days, both included. Left out = this month until today.
export class FinanceQueryDto {
  @IsOptional()
  @Matches(BD_DATE_PATTERN, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(BD_DATE_PATTERN, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}
