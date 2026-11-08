// src/products/search-tokens.util.ts
export const buildSearchTokens = (name: string, brand?: string): string[] => [
  ...new Set(
    `${name} ${brand ?? ''}`
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean),
  ),
];
