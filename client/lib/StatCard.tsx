import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

export const StatCard = ({ title, value, hint, icon: Icon }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-accent-foreground">
        <Icon className="h-[18px] w-[18px]" />
      </span>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);
