
import { PageHeader } from "../PageHeader";
import { CouponsManager } from "./Couponsmanager";

const CouponPage = () => (
  <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader
      title="Coupons"
      description="Manage discount codes for your store."
      action={null}
    />
    <CouponsManager />
  </div>
);

export default CouponPage;
