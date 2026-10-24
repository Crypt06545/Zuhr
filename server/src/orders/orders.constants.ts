// src/orders/orders.constants.ts

export const MAX_ORDER_LINES = 30;
export const MAX_LINE_QUANTITY = 20;

/* ============================================================
   DELIVERY CHARGE
   বগুড়ার ভেতরে ৳৬০, বাইরে ৳১৩০।
   .env-এ বদলানো যায় (না দিলে এই মানগুলোই চলে):
     SHIPPING_HOME_DISTRICT=Bogura
     SHIPPING_FEE_INSIDE=60
     SHIPPING_FEE_OUTSIDE=130
   ============================================================ */

const DEFAULT_HOME_DISTRICT = 'Bogura';
const DEFAULT_FEE_INSIDE = 60;
const DEFAULT_FEE_OUTSIDE = 130;

// env পড়া হয় দরকারের সময়, তাই .env যখনই লোড হোক কাজ করে
const readFee = (name: string, fallback: number): number => {
  const value = Number(process.env[name] ?? fallback);

  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export interface ShippingRule {
  insideDistrict: string;
  inside: number;
  outside: number;
}

export const getShippingRule = (): ShippingRule => ({
  insideDistrict:
    process.env.SHIPPING_HOME_DISTRICT?.trim() || DEFAULT_HOME_DISTRICT,
  inside: readFee('SHIPPING_FEE_INSIDE', DEFAULT_FEE_INSIDE),
  outside: readFee('SHIPPING_FEE_OUTSIDE', DEFAULT_FEE_OUTSIDE),
});

const sameDistrict = (a?: string | null, b?: string | null): boolean =>
  (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();

// জেলা না জানা থাকলে বা ভেতরের জেলা না হলে "বাইরের" চার্জ (বেশিটা), ভুল করে কম চার্জ হয় না
export const getShippingFee = (district?: string | null): number => {
  const rule = getShippingRule();

  return sameDistrict(district, rule.insideDistrict)
    ? rule.inside
    : rule.outside;
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
