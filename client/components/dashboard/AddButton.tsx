import type { ComponentProps } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "children"
> {
  label: string;
}

// Reusable "Add ..." button: <AddButton label="Add category" onClick={...} />
export const AddButton = ({ label, className, ...props }: AddButtonProps) => (
  <Button
    type="button"
    className={cn("h-9 w-full gap-1.5 sm:w-auto", className)}
    {...props}
  >
    <Plus className="h-4 w-4" />
    {label}
  </Button>
);
