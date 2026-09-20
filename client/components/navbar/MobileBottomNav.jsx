"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Heart, User } from "lucide-react";
import MobileDrawer from "./MobileDrawer";
import CartSidebar from "./CartSidebar";

const MobileBottomNav = () => {
  const pathname = usePathname();
  const user = null; // placeholder
  const totalItems = 0;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const isActive = (path) => (path ? pathname === path : false);

  const sideItems = [
    { key: "home", icon: Home, label: "Home", path: "/" },
    {
      key: "categories",
      icon: LayoutGrid,
      label: "Categories",
      action: () => setDrawerOpen(true),
    },
    { key: "wishlist", icon: Heart, label: "Wishlist", path: "/wishlist" },
    {
      key: "account",
      icon: User,
      label: user ? "Account" : "Login",
      path: user ? "/profile" : "/login",
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="relative h-[70px]">
          <svg
            viewBox="0 0 400 70"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <path
              d="M0,16 L149,16 Q165,16 172,4 Q182,-10 200,-10 Q218,-10 228,4 Q235,16 251,16 L400,16 L400,70 L0,70 Z"
              className="fill-white"
              style={{ filter: "drop-shadow(0 -2px 8px rgba(0,0,0,0.08))" }}
            />
          </svg>

          <div className="absolute top-[24px] left-0 right-0 flex justify-between px-3">
            {sideItems.slice(0, 2).map((item) => (
              <NavIcon
                key={item.key}
                item={item}
                active={isActive(item.path)}
              />
            ))}
            <div className="w-16 shrink-0" />
            {sideItems.slice(2).map((item) => (
              <NavIcon
                key={item.key}
                item={item}
                active={isActive(item.path)}
              />
            ))}
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="absolute left-1/2 -translate-x-1/2 -top-[22px] w-[54px] h-[54px] rounded-full bg-orange-600 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Open cart"
          >
            <ShoppingCart size={22} className="text-white" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>
          <span className="absolute top-[33px] left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-500">
            Cart
          </span>
        </div>
        <div className="bg-white h-[env(safe-area-inset-bottom)]" />
      </nav>

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <CartSidebar open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
};

const NavIcon = ({ item, active }) => {
  const Icon = item.icon;
  const inner = (
    <div
      className={`flex flex-col items-center justify-center gap-1 w-14 transition-colors ${
        active ? "text-orange-600" : "text-gray-500"
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 1.75} />
      <span className="text-[10px] font-semibold leading-none">
        {item.label}
      </span>
    </div>
  );

  return item.path ? (
    <Link href={item.path}>{inner}</Link>
  ) : (
    <button onClick={item.action}>{inner}</button>
  );
};

export default MobileBottomNav;
