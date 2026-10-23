import type { ReactNode } from "react";

import UserGuard from "@/components/common/UserGuard";

// /checkout আর /checkout/success/... দুটোই শুধু লগইন করা ব্যবহারকারীর জন্য।
// আসল আটকানো ব্যাকএন্ডে: POST /orders-এ JwtAccessGuard আছে।
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <UserGuard>{children}</UserGuard>;
}
