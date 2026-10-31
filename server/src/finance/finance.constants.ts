// src/finance/finance.constants.ts

export const FINANCE_CACHE_TTL = 300; // seconds, a safety net: every change moves the version

// One report can cover at most this many days (keeps the aggregation cheap)
export const MAX_REPORT_DAYS = 366;

// The key carries the orders version and the expenses version, so any order or
// expense change makes the old cached report unreachable.
export const financeSummaryKey = (
  ordersVersion: number,
  expensesVersion: number,
  from: string,
  to: string,
) => `finance:summary:o${ordersVersion}:e${expensesVersion}:${from}:${to}`;
