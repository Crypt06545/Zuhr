"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Settings,
  Star,
  User,
} from "lucide-react";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSignOut } from "@/hooks/Usesignout";

export const ROUTES = {
  login: "/login",
  profile: "/account/profile",
  orders: "/account/orders",
  reviews: "/account/reviews",
  adminDashboard: "/admin/dashboard",
} as const;

const itemClass =
  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

const AccountMenu = () => {
  const { data: user, isLoading, isAdmin } = useCurrentUser();
  const { signOut, isPending } = useSignOut();

  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // বাইরে ক্লিক বা Escape চাপলে মেনু বন্ধ
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = () => signOut(() => setOpen(false));

  // লোড হওয়ার সময় "Sign In" ঝিলিক দেয় না
  if (isLoading) {
    return (
      <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
        <span className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        <span className="hidden h-8 w-16 animate-pulse rounded bg-muted xl:block" />
      </div>
    );
  }

  // লগইন নেই
  if (!user) {
    return (
      <Link
        href={ROUTES.login}
        aria-label="Sign in"
        className="hidden items-center gap-2 text-muted-foreground transition-colors hover:text-primary lg:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
          <User size={16} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="hidden leading-tight xl:flex xl:flex-col">
          <span className="text-[11px]">Account</span>
          <span className="text-[13px] font-semibold text-foreground">
            Sign In
          </span>
        </span>
      </Link>
    );
  }

  const firstName = user.name.trim().split(" ")[0];

  return (
    <div ref={wrapper} className="relative hidden lg:block">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
          <User size={16} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="hidden text-left leading-tight xl:flex xl:flex-col">
          <span className="text-[11px]">Hello</span>
          <span className="max-w-[110px] truncate text-[13px] font-semibold text-foreground">
            {firstName}
          </span>
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`hidden transition-transform xl:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-3 w-60 rounded-xl border border-border bg-card p-1.5 shadow-lg"
        >
          <div className="border-b border-border px-3 pb-2.5 pt-2">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {user.name}
            </p>
            {user.email && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>

          <div className="py-1.5">
            {isAdmin && (
              <Link
                href={ROUTES.profile}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <Settings size={16} aria-hidden="true" />
                Profile settings
              </Link>
            )}
            <Link
              href={ROUTES.orders}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <Package size={16} aria-hidden="true" />
              Order history
            </Link>
            <Link
              href={ROUTES.reviews}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <Star size={16} aria-hidden="true" />
              Reviews and ratings
            </Link>
          </div>

          <div className="border-t border-border pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isPending}
              className={`${itemClass} disabled:opacity-60`}
            >
              {isPending ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <LogOut size={16} aria-hidden="true" />
              )}
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
