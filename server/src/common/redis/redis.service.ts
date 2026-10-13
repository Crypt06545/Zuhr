// src/common/redis/redis.service.ts

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from '@upstash/redis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  // Concurrent misses for the same key inside one instance run the loader once
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  // Every method fails open: if Redis is down the API keeps working from MongoDB

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key);
    } catch (error) {
      this.logger.warn(`get failed (${key}): ${String(error)}`);

      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      this.logger.warn(`set failed (${key}): ${String(error)}`);
    }
  }

  // Only if the key does not exist (used when filling the cache after a read miss)
  async setIfAbsent(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.client.set(key, value, { ex: ttlSeconds, nx: true });
    } catch (error) {
      this.logger.warn(`setIfAbsent failed (${key}): ${String(error)}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    try {
      await this.client.del(...keys);
    } catch (error) {
      this.logger.warn(`del failed (${keys.join(',')}): ${String(error)}`);
    }
  }

  async incr(key: string): Promise<void> {
    try {
      await this.client.incr(key);
    } catch (error) {
      this.logger.warn(`incr failed (${key}): ${String(error)}`);
    }
  }

  // Cache-aside read: hit -> Redis, miss -> loader, then store without clobbering newer data
  async remember<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const pending = this.inflight.get(key) as Promise<T> | undefined;

    if (pending) {
      return pending;
    }

    const promise = (async () => {
      const value = await loader();

      void this.setIfAbsent(key, value, ttlSeconds);

      return value;
    })();

    this.inflight.set(key, promise);

    // Clean up AFTER the promise is registered. (The old try/finally ran before `set` when the
    // loader threw synchronously, which left a rejected promise stuck in the map forever.)
    const cleanup = () => {
      this.inflight.delete(key);
    };

    promise.then(cleanup, cleanup);

    return promise;
  }
}
