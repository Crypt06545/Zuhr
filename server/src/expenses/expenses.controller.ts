// src/expenses/expenses.controller.ts

import {
  applyDecorators,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ObjectIdParamDto } from '../products/dto/object-id-param.dto.js';
import { UserType } from '../users/schemas/user.schema.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { QueryExpensesDto } from './dto/query-expenses.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { VoidExpenseDto } from './dto/void-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

type AuthUser = { userId: string; email: string };

// 401 without a token, 403 when the user is not an admin
const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAccessGuard, RolesGuard), Roles(UserType.ADMIN));

// Every route here is admin only. There is no DELETE route on purpose: use void.
@AdminOnly()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: Request, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto, (req.user as AuthUser).userId);
  }

  @Get()
  findAll(@Query() query: QueryExpensesDto) {
    return this.expensesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param() { id }: ObjectIdParamDto) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id/void')
  void(
    @Req() req: Request,
    @Param() { id }: ObjectIdParamDto,
    @Body() dto: VoidExpenseDto,
  ) {
    return this.expensesService.void(id, dto, (req.user as AuthUser).userId);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param() { id }: ObjectIdParamDto,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, dto, (req.user as AuthUser).userId);
  }
}
