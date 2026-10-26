// src/orders/orders.controller.ts

import {
  applyDecorators,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { CreateAdminOrderDto } from './dto/create-admin-order.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { AnalyticsQueryDto } from './dto/analytics-query.dto.js';
import { OrdersAnalyticsService } from './orders.analytics.service.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

import { OrdersService } from './orders.service.js';
import { IDEMPOTENCY_KEY_PATTERN } from './orders.constants.js';
import {
  AdminQueryOrdersDto,
  QueryMyOrdersDto,
} from './dto/query-orders.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';

type AuthUser = { userId: string; email: string };

// 401 without a token, 403 when the user is not an admin
const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAccessGuard, RolesGuard), Roles(UserType.ADMIN));

const assertIdempotencyKey = (key?: string) => {
  if (key && !IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new BadRequestException(
      'Idempotency-Key must be 8-64 characters: letters, numbers, - and _',
    );
  }
};

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly analytics: OrdersAnalyticsService,
  ) {}

  // ↓ admin/list আর admin/summary-এর পরে, admin/:id-এর আগে
  @AdminOnly()
  @Get('admin/analytics')
  getAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analytics.getAnalytics(query.from, query.to);
  }

  // ───────── Customer (signed in) ─────────

  // Send a fresh Idempotency-Key (any random 8-64 chars, e.g. a UUID) with every
  // checkout attempt. Sending the same request again returns the same order.
  @UseGuards(JwtAccessGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: Request,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    assertIdempotencyKey(idempotencyKey);

    return this.ordersService.create(req.user as AuthUser, dto, idempotencyKey);
  }

  @UseGuards(JwtAccessGuard)
  @Get('my')
  findMine(@Req() req: Request, @Query() query: QueryMyOrdersDto) {
    return this.ordersService.findMine((req.user as AuthUser).userId, query);
  }

  @UseGuards(JwtAccessGuard)
  @Get('my/:id')
  findMineById(@Req() req: Request, @Param() { id }: ObjectIdParamDto) {
    return this.ordersService.findMineById((req.user as AuthUser).userId, id);
  }

  @UseGuards(JwtAccessGuard)
  @Patch('my/:id/cancel')
  cancelMine(@Req() req: Request, @Param() { id }: ObjectIdParamDto) {
    return this.ordersService.cancelMine((req.user as AuthUser).userId, id);
  }

  // ───────── Admin ─────────
  // Static routes ('admin/...') stay above ':id'.

  // An admin enters an order on behalf of a customer (phone / social media)
  @AdminOnly()
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  createByAdmin(
    @Req() req: Request,
    @Body() dto: CreateAdminOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    assertIdempotencyKey(idempotencyKey);

    return this.ordersService.createByAdmin(
      req.user as AuthUser,
      dto,
      idempotencyKey,
    );
  }

  @AdminOnly()
  @Get('admin/list')
  findAllAdmin(@Query() query: AdminQueryOrdersDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @AdminOnly()
  @Get('admin/summary')
  getSummary() {
    return this.ordersService.getSummary();
  }

  @AdminOnly()
  @Get('admin/:id')
  findOneAdmin(@Param() { id }: ObjectIdParamDto) {
    return this.ordersService.findOneAdmin(id);
  }

  @AdminOnly()
  @Patch(':id/status')
  updateStatus(
    @Req() req: Request,
    @Param() { id }: ObjectIdParamDto,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      id,
      dto,
      (req.user as AuthUser).userId,
    );
  }

  @AdminOnly()
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param() { id }: ObjectIdParamDto,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, dto, (req.user as AuthUser).userId);
  }

  @AdminOnly()
  @Delete(':id')
  remove(@Param() { id }: ObjectIdParamDto) {
    return this.ordersService.remove(id);
  }
}
