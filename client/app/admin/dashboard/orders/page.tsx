
import { getOrders } from "@/lib/mock-dashboard";
import { PageHeader } from "../PageHeader";
import { OrdersManager } from "../OrdersManager";

const OrdersPage = async () => {
  const orders = await getOrders();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Orders"
        description="View orders, edit their details or remove them."
      />
      <OrdersManager orders={orders} />
    </div>
  );
};

export default OrdersPage;
