// src/common/redis/redis.module.ts

import { Global, Module } from '@nestjs/common';

import { redis } from '../../redis/redis.js';
import { REDIS_CLIENT, RedisService } from './redis.service.js';

@Global()
@Module({
  providers: [{ provide: REDIS_CLIENT, useValue: redis }, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
