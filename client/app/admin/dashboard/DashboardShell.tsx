"use client";

import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./Sidebar";
import { Topbar } from "./Topbar";

export const DashboardShell = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  );
};
