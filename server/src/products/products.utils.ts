// src/products/products.utils.ts

import { StockStatus } from './schemas/product.schema.js';

export function computeStock(
  variants: ReadonlyArray<{ stock: number }>,
  lowStockThreshold: number,
): { totalStock: number; stockStatus: StockStatus } {
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);

  let stockStatus = StockStatus.IN_STOCK;

  if (totalStock <= 0) {
    stockStatus = StockStatus.OUT_OF_STOCK;
  } else if (totalStock <= lowStockThreshold) {
    stockStatus = StockStatus.LOW_STOCK;
  }

  return { totalStock, stockStatus };
}
