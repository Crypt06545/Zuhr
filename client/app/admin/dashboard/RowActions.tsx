import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RowActionsProps {
  label: string;
  onEdit?: () => void;
  onDelete: () => void;
}

export const RowActions = ({ label, onEdit, onDelete }: RowActionsProps) => (
  <div className="flex items-center justify-end gap-1">
    {onEdit && (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
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
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);
