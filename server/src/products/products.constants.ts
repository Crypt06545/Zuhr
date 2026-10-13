// src/products/products.constants.ts

export const PRODUCT_IMAGE_FOLDER = 'zuhr/products';
export const MAX_PRODUCT_IMAGES = 5;

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

// Slugs are generated as a-z, 0-9 and '-' (max 80 + 7 chars). Anything else cannot exist,
// so we reject it before it reaches Redis or MongoDB.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_SLUG_LENGTH = 100;

// Detail page: everything except internal fields (cost price, thresholds)
export const PUBLIC_PROJECTION =
  '-variants.costPrice -lowStockThreshold -totalStock -__v';

// List cards: lighter, and no exact stock numbers (uses stockStatus instead)
export const LIST_PROJECTION = `${PUBLIC_PROJECTION} -variants.stock -description`;

/**
 * Cache design: every key carries a version number.
 * A DB change never rewrites cached data; it only bumps the version, so the old key becomes
 * unreachable and the next read rebuilds it from MongoDB. A slow reader that loaded old data
 * can only write into an old (already unreachable) key, so stale data can never come back.
 * TTLs are just a cleanup / safety net.
 */
export const CACHE = {
  listVersionKey: 'products:list:version',

  listTtl: 15 * 60, // 15 minutes
  detailTtl: 60 * 60, // 1 hour
  summaryTtl: 10 * 60, // 10 minutes

  listKey: (version: number, hash: string) =>
    `products:list:v${version}:${hash}`,

  // The stock summary only changes when a list changes (status / stockStatus), so it shares the list version
  stockSummaryKey: (listVersion: number) =>
    `products:stock-summary:v${listVersion}`,

  detailVersionKey: (slug: string) => `products:detail:ver:${slug}`,
  detailKey: (slug: string, version: number) =>
    `products:detail:v${version}:${slug}`,
} as const;
