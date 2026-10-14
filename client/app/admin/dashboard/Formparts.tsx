import type { ReactNode } from "react";

import { FieldError } from "@/components/common/FieldError";
import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export const Field = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: FieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor}>
      {label}
      {required && <span className="text-destructive"> *</span>}
      {hint && (
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      )}
    </Label>
    {children}
    <FieldError message={error} />
  </div>
);

export const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </section>
);
