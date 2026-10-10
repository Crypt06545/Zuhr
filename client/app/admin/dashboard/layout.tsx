import type { ReactNode } from "react";
import { DashboardShell } from "./DashboardShell";



const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <DashboardShell>{children}</DashboardShell>
);

export default DashboardLayout;
