"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShieldCheck, Star, UserRound } from "lucide-react";

import UserGuard from "@/components/common/UserGuard";
import { useProfile } from "@/hooks/Useprofile";

const LINKS = [
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/security", label: "Security", icon: ShieldCheck },
  { href: "/account/orders", label: "Order history", icon: Package },
  { href: "/account/reviews", label: "Reviews and ratings", icon: Star },
];

const initials = (name?: string) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

const AccountSummary = () => {
  const { data: profile } = useProfile();

  if (!profile) {
    return (
      <div className="hidden h-16 animate-pulse rounded-xl bg-muted/40 lg:block" />
    );
  }

  return (
    <div className="hidden items-center gap-3 rounded-xl border border-border bg-card p-3 lg:flex">
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatarUrl}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
        >
          {initials(profile.name)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{profile.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {profile.email}
        </p>
      </div>
    </div>
  );
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <UserGuard>
      <div className="container mx-auto px-4 py-8 lg:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          My account
        </h1>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <AccountSummary />

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
          </aside>

          <main className="min-w-0 max-w-3xl">{children}</main>
        </div>
      </div>
    </UserGuard>
  );
}
