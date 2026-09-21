// ব্যবহার: NestJS প্রজেক্টের রুটে (যেখানে nest-cli.json আছে) চালান:
//   node scaffold.mjs
//
// Windows / Mac / Linux — সবখানে চলে (bash লাগে না)।
// এটা শুধু ফাইল-ফোল্ডার বানায়, ভেতরের কোড আপনি লিখবেন।

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const nest = (args) => {
  console.log(`\n$ nest g ${args}`);
  execSync(`npx nest g ${args}`, { stdio: 'inherit' });
};

const touch = (path) => {
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) writeFileSync(path, '');
};

/* ── ১. Feature module: module + controller + service (dto/ ও schemas/ ফোল্ডারসহ) ── */
const featureModules = [
  'auth',
  'users',
  'addresses',
  'categories',
  'products',
  'inventory',
  'cart',
  'wishlist',
  'coupons',
  'orders',
  'payments',
  'expenses',
  'analytics',
  'chat',
];

for (const m of featureModules) {
  nest(`res modules/${m} --type rest --crud false --no-spec`);
  mkdirSync(`src/modules/${m}/dto`, { recursive: true });
  mkdirSync(`src/modules/${m}/schemas`, { recursive: true });
}

// repository ফাইল — যেসব মডিউলের নিজস্ব schema আছে
for (const m of [
  'users',
  'addresses',
  'categories',
  'products',
  'inventory',
  'cart',
  'wishlist',
  'coupons',
  'orders',
  'expenses',
]) {
  touch(`src/modules/${m}/${m}.repository.ts`);
}

/* ── ২. /admin/... এর জন্য আলাদা controller (URL একই রাখতে) ── */
for (const m of ['users', 'products', 'categories', 'coupons', 'orders']) {
  nest(`co modules/${m}/admin-${m} --flat --no-spec`);
}

/* ── ৩. Infrastructure ── */
nest('mo mail --no-spec');
nest('s mail/mail --flat --no-spec');
nest('mo storage --no-spec');
nest('s storage/cloudinary --flat --no-spec');
nest('mo notifications --no-spec');
nest('s notifications/telegram --flat --no-spec');
nest('mo ai --no-spec');
nest('s ai/gemini --flat --no-spec');

/* ── ৪. common: guards, decorators, filter, interceptor, pipe ── */
for (const g of ['jwt-auth', 'roles', 'ip-ban', 'account-lock']) {
  nest(`gu common/guards/${g} --flat --no-spec`);
}
for (const d of ['current-user', 'roles', 'public']) {
  nest(`d common/decorators/${d} --flat --no-spec`);
}
nest('f common/filters/all-exceptions --flat --no-spec');
nest('itc common/interceptors/response --flat --no-spec');
nest('pi common/pipes/parse-object-id --flat --no-spec');

for (const u of ['generate-otp', 'generate-order-id', 'slug']) {
  touch(`src/common/utils/${u}.ts`);
}

console.log('\n✅ সব ফাইল-ফোল্ডার তৈরি হয়েছে।');
