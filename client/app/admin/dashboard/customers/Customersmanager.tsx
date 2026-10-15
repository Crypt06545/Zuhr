"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PaginatedTable,
  type Column,
} from "@/components/common/Paginatedtable";
import { PaginationBar } from "@/components/common/Paginationbar";
import {
  useCursorPagination,
  useDebouncedValue,
} from "@/hooks/Usecursorpagination";
import { Customer, CustomersFilters, getAdminCustomersApi } from "@/lib/api/Customers.api";


const columns: Column<Customer>[] = [
  {
    header: "Customer",
    cell: (c) => (
      <div>
        <p className="font-medium">{c.name}</p>
        <p className="text-xs text-muted-foreground">{c.email}</p>
      </div>
    ),
  },
  { header: "Phone", cell: (c) => c.phone || "—" },
  {
    header: "Orders",
    cell: (c) => c.ordersCount ?? 0,
    className: "text-right",
  },
  {
    header: "Joined",
    cell: (c) => new Date(c.createdAt).toLocaleDateString(),
    className: "text-right",
  },
];

export const CustomersManager = () => {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const search = useDebouncedValue(query.trim(), 400);

  const list = useCursorPagination<Customer, CustomersFilters>({
    queryKey: ["admin-customers"],
    fetcher: getAdminCustomersApi,
    filters: { search: search || undefined },
    limit,
  });

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>All customers</CardTitle>
          <CardDescription>
            Page {list.page} · {list.items.length} customers shown
          </CardDescription>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers..."
            className="h-9 pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <PaginatedTable
          columns={columns}
          rows={list.items}
          getKey={(c) => c._id}
          isLoading={list.isLoading}
          isFetching={list.isFetching}
          emptyText="No customers found."
        />
        <PaginationBar
          page={list.page}
          count={list.items.length}
          total={list.total}
          limit={limit}
          onLimitChange={setLimit}
          hasPrev={list.hasPrev}
          hasNext={list.hasNext}
          onPrev={list.goPrev}
          onNext={list.goNext}
        />
      </CardContent>
    </Card>
  );
};
