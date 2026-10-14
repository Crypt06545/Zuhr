import { notFound } from "next/navigation";

import { orderToInvoice } from "@/lib/invoice";
import { getOrders } from "@/lib/mock-dashboard";
import { toPublicOrderId } from "@/lib/routes";
import { InvoiceView } from "../../../InvoiceView";

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const InvoicePage = async ({ params }: InvoicePageProps) => {
  const { id } = await params;
  const orderId = toPublicOrderId(safeDecode(id));

  // Mock: find the order in the list. Replace with a fetch-by-id API call later.
  const orders = await getOrders();
  const order = orders.find((o) => toPublicOrderId(o.id) === orderId);

  if (!order) notFound();

  return <InvoiceView invoice={orderToInvoice(order)} />;
};

export default InvoicePage;
