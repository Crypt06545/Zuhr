// src/finance/finance.controller.ts

import {
  applyDecorators,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UserType } from '../users/schemas/user.schema.js';
import { FinanceQueryDto } from './dto/finance-query.dto.js';
import { FinanceService } from './finance.service.js';

// 401 without a token, 403 when the user is not an admin
const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAccessGuard, RolesGuard), Roles(UserType.ADMIN));

@AdminOnly()
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary(@Query() query: FinanceQueryDto) {
    return this.financeService.getSummary(query.from, query.to);
  }
}
