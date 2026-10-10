import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowActionsProps {
  label: string;
  onEdit?: () => void;
  onDelete: () => void;
}

export const RowActions = ({ label, onEdit, onDelete }: RowActionsProps) => (
  <DropdownMenu modal={false}>
    <DropdownMenuTrigger
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    >
      <MoreHorizontal className="h-4 w-4" />
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end">
      {onEdit && (
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        onSelect={onDelete}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
