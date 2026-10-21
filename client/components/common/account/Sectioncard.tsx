import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode; // শিরোনামের ডানে (যেমন status badge)
  footer?: ReactNode; // নিচের বাটন-বার
  children: ReactNode;
};

const SectionCard = ({
  title,
  description,
  action,
  footer,
  children,
}: SectionCardProps) => (
  <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
    <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </header>

    <div className="px-6 py-5">{children}</div>

    {footer && (
      <footer className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-6 py-3">
        {footer}
      </footer>
    )}
  </section>
);

export default SectionCard;
