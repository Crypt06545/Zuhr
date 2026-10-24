"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { getAdminOrderApi } from "@/lib/api/admin-orders.api";
import { apiErrorMessage } from "@/lib/api/orders.api";
import { orderDetailKey } from "@/lib/admin-orders";
import { orderToInvoice } from "@/lib/invoice";
import { ORDERS_PATH } from "@/lib/routes";
import { InvoiceView } from "../../../InvoiceView";

const InvoicePage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: orderDetailKey(id),
    queryFn: () => getAdminOrderApi(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-8">
        <div className="h-10 animate-pulse rounded-md bg-muted/50" />
        <div className="h-[820px] animate-pulse rounded-2xl bg-muted/50" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {apiErrorMessage(error, "Could not load this invoice.")}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
          <Link
            href={ORDERS_PATH}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  return <InvoiceView invoice={orderToInvoice(order)} />;
};

export default InvoicePage;
