// src/app.module.ts

import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    MongoDbModule,
    RedisModule,
    UsersModule,
    AuthModule,
    QueueModule,
    CategoriesModule,
    CloudinaryModule,
    ProductsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
