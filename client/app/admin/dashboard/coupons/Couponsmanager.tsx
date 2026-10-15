"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  getAdminCouponsApi,
  type Coupon,
  type CouponsFilters,
} from "@/lib/api/coupons.api";

const columns: Column<Coupon>[] = [
  {
    header: "Code",
    cell: (c) => <span className="font-mono font-medium">{c.code}</span>,
  },
  {
    header: "Discount",
    cell: (c) => (c.type === "percentage" ? `${c.value}%` : `BDT ${c.value}`),
  },
  {
    header: "Used",
    cell: (c) => `${c.usedCount ?? 0} / ${c.usageLimit ?? "∞"}`,
  },
  {
    header: "Expires",
    cell: (c) =>
      c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never",
  },
  {
    header: "Status",
    cell: (c) => (
      <Badge variant={c.isActive ? "secondary" : "outline"}>
        {c.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export const CouponsManager = () => {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const search = useDebouncedValue(query.trim(), 400);

  const list = useCursorPagination<Coupon, CouponsFilters>({
    queryKey: ["admin-coupons"],
    fetcher: getAdminCouponsApi,
    filters: { search: search || undefined },
    limit,
  });

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>All coupons</CardTitle>
          <CardDescription>
            Page {list.page} · {list.items.length} coupons shown
          </CardDescription>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coupon code..."
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
          emptyText="No coupons found."
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
