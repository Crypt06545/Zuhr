// src/orders/orders.constants.ts

export const MAX_ORDER_LINES = 30;
export const MAX_LINE_QUANTITY = 20;

// Flat shipping fee from the environment. Read when needed, so it works
// whenever your env file gets loaded.
export const getShippingFee = (): number => {
  const fee = Number(process.env.SHIPPING_FEE ?? 0);
  return Number.isFinite(fee) && fee >= 0 ? fee : 0;
};

// Customers never see cost price, admin notes or the internal timeline
export const CUSTOMER_PROJECTION =
  '-items.costPrice -timeline -adminNote -idempotencyKey -__v';

// Admin list rows: no timeline (only the detail page needs it)
export const ADMIN_LIST_PROJECTION = '-timeline -idempotencyKey -__v';

export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export const SUMMARY_VERSION_KEY = 'orders:summary:version';
export const SUMMARY_CACHE_TTL = 60; // seconds, a safety net: every change bumps the version
export const summaryCacheKey = (version: number) =>
  `orders:summary:v${version}`;

// Bangladesh mobile number, with or without +88 / 88
export const BD_MOBILE_PATTERN = /^(?:\+?88)?01[3-9][0-9]{8}$/;

// bKash TrxID is 10 letters/numbers. Nagad is similar, so a slightly wider range is allowed.
export const TRANSACTION_ID_PATTERN = /^[A-Z0-9]{8,12}$/;
