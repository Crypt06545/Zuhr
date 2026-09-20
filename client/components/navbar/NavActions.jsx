"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Heart,
  ShoppingCart,
  LayoutDashboard,
  Package,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartSidebar from "./CartSidebar";
import WishlistSidebar from "./WishlistSidebar";


const NavActions = () => {
  // 🔸 Placeholder — পরে Zustand থেকে আসবে
  const user = null;
  const isAdmin = user?.role === "Admin";
  const totalItems = 0;
  const totalWishlistItems = 0;

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const handleSignOut = () => {
    console.log("logout");
  };

  return (
    <>
      <div className="flex items-center gap-3 lg:gap-5">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-2.5 text-left text-gray-700 hover:text-orange-600 transition-colors group outline-none">
                <div className="p-2 border border-gray-200 rounded-full bg-white group-hover:bg-orange-50 group-hover:border-orange-200 transition-colors">
                  <User size={20} className="group-hover:text-orange-600" />
                </div>
                <div className="hidden lg:block text-xs">
                  <p className="text-gray-400 font-normal leading-tight">
                    Hello,
                  </p>
                  <span className="font-semibold text-gray-900 leading-tight group-hover:text-orange-600 transition-colors truncate max-w-[80px] block">
                    {user.name}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-gray-400 font-normal truncate">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <User size={14} /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/orders"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Package size={14} /> My Orders
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2 cursor-pointer font-semibold text-orange-600"
                    >
                      <LayoutDashboard size={14} /> Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleSignOut();
                }}
                className="flex items-center gap-2 text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-50"
              >
                <LogOut size={14} />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-2.5 text-left text-gray-700 hover:text-orange-600 transition-colors group"
          >
            <div className="p-2 border border-gray-200 rounded-full bg-white group-hover:bg-orange-50 group-hover:border-orange-200 transition-colors">
              <User size={20} className="group-hover:text-orange-600" />
            </div>
            <div className="hidden lg:block text-xs">
              <p className="text-gray-400 font-normal leading-tight">Account</p>
              <span className="font-semibold text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">
                Sign In
              </span>
            </div>
          </Link>
        )}

        <button
          onClick={() => setWishlistOpen(true)}
          className="p-2 lg:p-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-all relative"
          aria-label="Open wishlist"
        >
          <Heart size={20} className="w-5 h-5" />
          {totalWishlistItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white">
              {totalWishlistItems > 99 ? "99+" : totalWishlistItems}
            </span>
          )}
        </button>

        <button
          onClick={() => setCartOpen(true)}
          className="p-2 lg:p-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-all relative"
          aria-label="Open cart"
        >
          <ShoppingCart size={20} className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </button>
      </div>

      <CartSidebar open={cartOpen} onOpenChange={setCartOpen} />
      <WishlistSidebar open={wishlistOpen} onOpenChange={setWishlistOpen} />
    </>
  );
};

export default NavActions;
