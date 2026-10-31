
import { ExpensesManager } from "../ExpensesManager";
import { PageHeader } from "../PageHeader";

const ExpensesPage = () => (
  <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <PageHeader
      title="Expenses"
      description="Record business costs like courier bills, ads and packaging. A wrong entry is voided, never deleted."
    />
    <ExpensesManager />
  </div>
);

export default ExpensesPage;
