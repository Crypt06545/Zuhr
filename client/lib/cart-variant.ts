// lib/cart-variant.ts

// stock থাকতেও পারে (প্রোডাক্ট পেজ), না-ও থাকতে পারে (প্রোডাক্ট কার্ড)
const stockOf = (variant: object): number | undefined =>
  (variant as { stock?: number }).stock;

/**
 * কোন variant "ডিফল্ট": প্রোডাক্ট কার্ড আর প্রোডাক্ট পেজ দুজনেই এই একই নিয়ম মানে,
 * তাই দুই জায়গা থেকে যোগ করলে cart-এ একই লাইন থাকে (আলাদা লাইন হয় না)।
 *
 * - নিয়ম: প্রথম variant।
 * - ব্যতিক্রম: স্টকের সংখ্যা জানা থাকলে (শুধু প্রোডাক্ট পেজে জানা যায়) আর প্রথমটা শেষ হয়ে গেলে,
 *   প্রথম যেটা পাওয়া যায় সেটা।
 *
 * যেকোনো variant টাইপ নেয় (stock ফিল্ড থাকা বাধ্যতামূলক নয়) এবং একই টাইপ ফেরত দেয়,
 * তাই size, color, compareAtPrice ইত্যাদি ঠিকঠাক চেনা যায়।
 */
export const pickDefaultVariant = <T extends object>(
  variants: T[],
): T | undefined => {
  const first = variants[0];

  if (!first) return undefined;

  const firstStock = stockOf(first);

  if (firstStock !== undefined && firstStock <= 0) {
    return variants.find((variant) => (stockOf(variant) ?? 0) > 0) ?? first;
  }

  return first;
};
