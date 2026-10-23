// lib/checkout.ts
import type { PaymentMethod } from "@/lib/checkout-config";
import type { CartItem } from "@/store/cart-store";

export type { PaymentMethod };

export type CheckoutFormValues = {
  // যোগাযোগ
  fullName: string;
  phone: string;
  // ঠিকানা
  district: string;
  address: string;
  note: string;
  // পেমেন্ট
  paymentMethod: PaymentMethod;
  senderNumber: string;
  transactionId: string;
};

export const DEFAULT_VALUES: CheckoutFormValues = {
  fullName: "",
  phone: "",
  district: "",
  address: "",
  note: "",
  paymentMethod: "cod",
  senderNumber: "",
  transactionId: "",
};

// +88 / 88 / ফাঁকা জায়গা / হাইফেন বাদ: 01XXXXXXXXX
export const normalizePhone = (raw: string) =>
  raw.replace(/[\s-]/g, "").replace(/^\+?88/, "");

// POST /orders-এর body। email যায় না: সার্ভার লগইন করা ব্যবহারকারীর email টোকেন থেকে নেয়।
// দামও যায় না: সার্ভার productId + variantId দেখে নিজে দাম, স্টক ও ডেলিভারি চার্জ ঠিক করে।
export type CreateOrderBody = {
  items: { productId: string; variantId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    district: string;
  };
  paymentTransactionId?: string;
  paymentSenderPhone?: string;
  note?: string;
};

export const buildCreateOrderBody = (
  values: CheckoutFormValues,
  items: CartItem[],
): CreateOrderBody => {
  const note = values.note.trim();
  const mobilePayment = values.paymentMethod !== "cod";

  return {
    items: items.map(({ productId, variantId, quantity }) => ({
      productId,
      variantId,
      quantity,
    })),
    paymentMethod: values.paymentMethod,
    shippingAddress: {
      fullName: values.fullName.trim(),
      phone: normalizePhone(values.phone),
      addressLine: values.address.trim(),
      city: values.district,
      district: values.district,
    },
    ...(mobilePayment && {
      paymentTransactionId: values.transactionId.trim().toUpperCase(),
      paymentSenderPhone: normalizePhone(values.senderNumber),
    }),
    ...(note && { note }),
  };
};

// প্রতিটি checkout চেষ্টার জন্য একটা key (8-64 অক্ষর: অক্ষর, সংখ্যা, - আর _)।
// একই key-তে আবার পাঠালে সার্ভার নতুন অর্ডার না বানিয়ে আগেরটাই ফেরত দেয় (ডাবল ক্লিক/নেট-ফেল নিরাপদ)।
export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
