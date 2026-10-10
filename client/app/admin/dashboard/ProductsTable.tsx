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
import { getProductState, ProductStatusBadge } from "./ProductStatusBadge";
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
  <div className="w-full overflow-x-auto">
    <Table className="w-full table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[36%]">Product</TableHead>

          <TableHead className="hidden w-[20%] sm:table-cell">
            Category
          </TableHead>

          <TableHead className="w-[16%] text-right">Price</TableHead>

          <TableHead className="hidden w-[8%] text-right md:table-cell">
            Stock
          </TableHead>

          <TableHead className="w-[12%] text-left">Status</TableHead>

          <TableHead className="w-[8%] text-right">
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
              <TableCell className="overflow-hidden">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-accent-foreground">
                    <Package className="h-[18px] w-[18px]" />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                      {product.id}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="hidden truncate text-muted-foreground sm:table-cell">
                {product.category}
              </TableCell>

              <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                {formatCurrency(product.price)}
              </TableCell>

              <TableCell className="hidden text-right tabular-nums md:table-cell">
                {product.stock}
              </TableCell>

              <TableCell className="text-left">
                <ProductStatusBadge state={getProductState(product)} />
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end">
                  <RowActions
                    label={`Actions for ${product.name}`}
                    onEdit={() => onEdit(product)}
                    onDelete={() => onDelete(product)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
