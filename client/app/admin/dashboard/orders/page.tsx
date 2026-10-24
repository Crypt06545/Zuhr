import { OrdersManager } from "../OrdersManager";
import { PageHeader } from "../PageHeader";

// অর্ডার এখন ব্রাউজার থেকে সরাসরি ব্যাকএন্ড API দিয়ে আসে (মক ডাটা নেই)
const OrdersPage = () => (
  <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader
      title="Orders"
      description="Review orders, verify payments, update their status or edit their details."
    />
    <OrdersManager />
  </div>
);

export default OrdersPage;
