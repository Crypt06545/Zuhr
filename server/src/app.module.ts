// src/app.module.ts

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import './redis/redis.js';
import { MongoDbModule } from './database/mongodb.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { QueueModule } from './queue/queue.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module.js';
import { ProductsModule } from './products/products.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { AppThrottlerGuard } from './guards/app-throttler.guard.js';

@Module({
  imports: [
    // Rate limit: sob endpoint e minute e 100 request (ttl millisecond e).
    // Sensitive endpoint e controller theke @Throttle() diye aro kora hoy.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    MongoDbModule,
    RedisModule,
    UsersModule,
    AuthModule,
    QueueModule,
    CategoriesModule,
    CloudinaryModule,
    ProductsModule,
    OrdersModule,
    TelegramModule,
    ExpensesModule,
    FinanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guard: sob route e rate limit cholbe
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class AppModule {}
