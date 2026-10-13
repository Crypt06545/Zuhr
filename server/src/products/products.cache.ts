// src/products/products.cache.ts

import { Injectable } from '@nestjs/common';

import { RedisService } from '../common/redis/redis.service.js';
import { CACHE } from './products.constants.js';

@Injectable()
export class ProductsCache {
  constructor(private readonly redis: RedisService) {}

  // ───────── Read (cache-aside, version-keyed) ─────────

  async list<T>(queryHash: string, loader: () => Promise<T>): Promise<T> {
    const version = await this.listVersion();

    return this.redis.remember(
      CACHE.listKey(version, queryHash),
      CACHE.listTtl,
      loader,
    );
  }

  async detail<T>(slug: string, loader: () => Promise<T>): Promise<T> {
    const version =
      (await this.redis.get<number>(CACHE.detailVersionKey(slug))) ?? 0;

    return this.redis.remember(
      CACHE.detailKey(slug, version),
      CACHE.detailTtl,
      loader,
    );
  }

  async stockSummary<T>(loader: () => Promise<T>): Promise<T> {
    const version = await this.listVersion();

    return this.redis.remember(
      CACHE.stockSummaryKey(version),
      CACHE.summaryTtl,
      loader,
    );
  }

  // ───────── Invalidate (call after the DB change is committed) ─────────

  // Old detail key becomes unreachable; the next read rebuilds it from MongoDB
  bumpDetail(slug: string): Promise<void> {
    return this.redis.incr(CACHE.detailVersionKey(slug));
  }

  // Old list keys and the old stock summary become unreachable
  bumpLists(): Promise<void> {
    return this.redis.incr(CACHE.listVersionKey);
  }

  private async listVersion(): Promise<number> {
    return (await this.redis.get<number>(CACHE.listVersionKey)) ?? 0;
  }
}
