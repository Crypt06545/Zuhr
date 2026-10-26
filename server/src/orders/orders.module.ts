// src/orders/orders.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductsModule } from '../products/products.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { UsersModule } from '../users/users.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { Order, OrderSchema } from './schemas/order.schema.js';
import { OrdersAnalyticsService } from './orders.analytics.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ProductsModule, // exports ProductsService (stock + checkout lookups)
    UsersModule, // RolesGuard needs UsersService
    TelegramModule, // new-order notification
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersAnalyticsService],
  exports: [OrdersService],
})
export class OrdersModule {}
