import type { Metadata } from "next";
import OrderSuccessView from "../../Ordersuccessview";

export const metadata: Metadata = {
  title: "Order confirmed | ZUHR",
  robots: { index: false },
};

export default function OrderSuccessPage() {
  return <OrderSuccessView />;
}
