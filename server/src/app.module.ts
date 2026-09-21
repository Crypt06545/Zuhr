import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import './redis/redis.js';
import { MongoDbModule } from './database/mongodb.js';

@Module({
  imports: [MongoDbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
