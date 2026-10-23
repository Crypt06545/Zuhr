import type { Metadata } from "next";
import CheckoutView from "./CheckoutView";
import UserGuard from "@/components/common/UserGuard";

export const metadata: Metadata = {
  title: "Checkout | ZUHR",
  description: "Confirm your delivery details and payment.",
  robots: { index: false }, // checkout পেজ সার্চ ইঞ্জিনে আসার দরকার নেই
};

export default function CheckoutPage() {
  return (
    <>
      <UserGuard>
        <CheckoutView />
      </UserGuard>
    </>
  );
}
