
import { getProducts } from "@/lib/mock-products";
import { PageHeader } from "../PageHeader";
import { ProductsManager } from "../ProductsManager";

const ProductsPage = async () => {
  const products = await getProducts();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Products"
        description="Manage your catalog, edit details or remove products."
      />
      <ProductsManager initialProducts={products} />
    </div>
  );
};

export default ProductsPage;
