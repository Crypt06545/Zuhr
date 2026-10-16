"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Heart, User } from "lucide-react";

type NavItem = {
  key: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  label: string;
  path?: string;
  action?: () => void;
};

const BAR_HEIGHT = 68;
const FAB_SIZE = 54;

const MobileBottomNav = () => {
  const pathname = usePathname();

  const totalItems = 0;
  const user = null;

  const isActive = (path: string) => pathname === path;

  const leftItems: NavItem[] = [
    { key: "home", icon: Home, label: "Home", path: "/" },
    {
      key: "categories",
      icon: LayoutGrid,
      label: "Categories",
      action: () => console.log("open categories"),
    },
  ];

  const rightItems: NavItem[] = [
    { key: "wishlist", icon: Heart, label: "Wishlist", path: "/wishlist" },
    {
      key: "account",
      icon: User,
      label: user ? "Account" : "Login",
      path: user ? "/profile" : "/login",
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="relative w-full" style={{ height: BAR_HEIGHT }}>
        {/* Notched bar background */}
        <svg
          viewBox="0 0 400 68"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          style={{
            filter:
              "drop-shadow(0 -1px 0 rgba(0,0,0,0.06)) drop-shadow(0 -4px 12px rgba(0,0,0,0.05))",
          }}
        >
          <path
            d="
              M0,10
              L148,10
              C160,10 164,10 168,4
              C176,-10 184,-24 200,-24
              C216,-24 224,-10 232,4
              C236,10 240,10 252,10
              L400,10
              L400,68
              L0,68
              Z
            "
            className="fill-card"
          />
        </svg>

        {/* Nav icons — 5 columns */}
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 items-end px-2 pb-2">
          {leftItems.map((item) => (
            <NavIcon
              key={item.key}
              item={item}
              active={!!item.path && isActive(item.path)}
            />
          ))}

          <div aria-hidden="true" />

          {rightItems.map((item) => (
            <NavIcon
              key={item.key}
              item={item}
              active={!!item.path && isActive(item.path)}
            />
          ))}
        </div>

        {/* Floating cart button — now matches navbar's primary search button */}
        <button
          type="button"
          onClick={() => console.log("open cart")}
          aria-label={`Open cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            top: -(FAB_SIZE / 2) - 4,
          }}
          className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-full bg-primary shadow-lg ring-4 ring-card transition-transform active:scale-95"
        >
          <ShoppingCart
            size={22}
            strokeWidth={2}
            className="text-primary-foreground"
            aria-hidden="true"
          />

          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background ring-2 ring-card">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </button>
      </div>

      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)] bg-card" />
    </nav>
  );
};

/* ---------- Nav Icon ---------- */

type NavIconProps = {
  item: NavItem;
  active: boolean;
};

const NavIcon = ({ item, active }: NavIconProps) => {
  const Icon = item.icon;

  const classes = `group flex min-h-[48px] flex-col items-center justify-center gap-1 transition-colors ${
    active ? "text-primary" : "text-muted-foreground"
  }`;

  const content = (
    <>
      <Icon
        size={22}
        strokeWidth={active ? 2.4 : 1.8}
        aria-hidden="true"
        className="shrink-0"
      />
      <span className="text-[10px] font-medium leading-none tracking-tight">
        {item.label}
      </span>
    </>
  );

  if (item.path) {
    return (
      <Link
        href={item.path}
        className={classes}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.action} className={classes}>
      {content}
    </button>
  );
};

export default MobileBottomNav;
