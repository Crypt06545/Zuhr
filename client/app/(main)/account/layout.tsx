"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Star, UserRound } from "lucide-react";
import UserGuard from "@/components/common/UserGuard";

const LINKS = [
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/orders", label: "Order history", icon: Package },
  { href: "/account/reviews", label: "Reviews and ratings", icon: Star },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <UserGuard>
      <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[240px_1fr] lg:px-6">
        <nav
          aria-label="Account"
          className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
        >
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-primary"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </UserGuard>
  );
}
