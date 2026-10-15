import type { ReactNode } from "react";

import { AdminGuard } from "@/components/common/AdminGuard";

// Every page under /admin goes through the guard first
const AdminLayout = ({ children }: { children: ReactNode }) => (
  <AdminGuard>{children}</AdminGuard>
);

export default AdminLayout;
