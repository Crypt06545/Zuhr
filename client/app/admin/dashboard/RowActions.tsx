import Link from "next/link";
import { FileText, Pencil, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RowActionsProps {
  label: string;
  invoiceHref?: string;
  onEdit?: () => void;
  onDelete: () => void;
}

export const RowActions = ({
  label,
  invoiceHref,
  onEdit,
  onDelete,
}: RowActionsProps) => (
  <div className="flex items-center justify-end gap-1">
    {invoiceHref && (
      <Link
        href={invoiceHref}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8",
        )}
        aria-label={`Invoice for ${label}`}
        title="Invoice"
      >
        <FileText className="h-4 w-4" />
      </Link>
    )}
    {onEdit && (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    )}
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={onDelete}
      aria-label={`Delete ${label}`}
      title="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);
