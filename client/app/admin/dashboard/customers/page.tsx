import { PageHeader } from "../PageHeader";
import { CustomersManager } from "./Customersmanager";

const CustomersPage = () => (
  <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader
      title="Customers"
      description="See everyone who has signed up to your store."
      action={null}
    />
    <CustomersManager />
  </div>
);

export default CustomersPage;
