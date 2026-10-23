import type { ReactNode } from "react";

type CheckoutSectionProps = {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
};

// প্রতিটি ধাপ: নম্বরসহ শিরোনাম + কার্ড
const CheckoutSection = ({
  step,
  title,
  description,
  children,
}: CheckoutSectionProps) => (
  <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
    <header className="mb-5 flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
      >
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="text-[16px] font-semibold leading-7">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
    {children}
  </section>
);

export default CheckoutSection;
