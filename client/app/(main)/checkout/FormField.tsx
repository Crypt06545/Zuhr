import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

// native <select> ও <textarea>-এর জন্য shadcn Input-এর মতো একই চেহারা
export const controlClass =
  "w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 aria-[invalid=true]:border-red-500";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

const FormField = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: FormFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor}>
      {label}
      {required && <span className="text-red-500"> *</span>}
      {hint && (
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      )}
    </Label>
    {children}
    {error && (
      <p role="alert" className="text-xs text-red-500">
        {error}
      </p>
    )}
  </div>
);

export default FormField;
