import { Package } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/mock-products";
import { getStockState, StockBadge } from "./ProductStatusBadge";
import { RowActions } from "./RowActions";

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductsTable = ({
  products,
  onEdit,
  onDelete,
}: ProductsTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Product</TableHead>
        <TableHead className="hidden sm:table-cell">Category</TableHead>
        <TableHead className="text-right">Price</TableHead>
        <TableHead className="hidden text-right md:table-cell">Stock</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="w-24">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {products.length === 0 ? (
        <TableRow>
          <TableCell
            colSpan={6}
            className="h-24 text-center text-muted-foreground"
          >
            No products found.
          </TableCell>
        </TableRow>
      ) : (
        products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-accent-foreground">
                  <Package className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="max-w-[9rem] truncate text-sm font-medium sm:max-w-none">
                    {product.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {product.id}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {product.category}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatCurrency(product.price)}
            </TableCell>
            <TableCell className="hidden text-right tabular-nums md:table-cell">
              {product.stock}
            </TableCell>
            <TableCell>
              <StockBadge state={getStockState(product.stock)} />
            </TableCell>
            <TableCell>
              <RowActions
                label={product.name}
                onEdit={() => onEdit(product)}
                onDelete={() => onDelete(product)}
              />
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);
