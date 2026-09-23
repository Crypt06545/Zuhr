import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import './redis/redis.js';
import { MongoDbModule } from './database/mongodb.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersController } from './auth/users/users.controller.js';

@Module({
  imports: [MongoDbModule, UsersModule, AuthModule],
  controllers: [AppController, UsersController],
  providers: [AppService],
})
export class AppModule {}
