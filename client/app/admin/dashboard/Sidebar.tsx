"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { BRAND_NAME, NAV_ITEMS } from "./nav-items";

interface SidebarContentProps {
  onNavigate?: () => void;
}

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    // Dashboard is active only on its exact route.
    if (href === "/admin/dashboard") {
      return pathname === href;
    }

    // Other navigation items remain active on their nested routes.
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
          {BRAND_NAME.charAt(0)}
        </div>

        <span className="text-lg font-semibold tracking-tight">
          {BRAND_NAME}
        </span>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-1 overflow-y-auto p-3"
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />

              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin profile */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/15 text-sm text-accent-foreground">
              A
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Admin</p>

            <p className="truncate text-xs text-muted-foreground">
              admin@example.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
