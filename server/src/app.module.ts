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
// app.module.ts

@Module({
  imports: [
    MongoDbModule,
    UsersModule,
    AuthModule,
    QueueModule,
    CategoriesModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
