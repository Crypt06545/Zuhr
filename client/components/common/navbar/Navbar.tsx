"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, Search, User, Heart, ShoppingCart } from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex items-center gap-3 px-4 py-3 lg:gap-6 lg:px-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Home"
          className="flex shrink-0 items-center transition-opacity hover:opacity-80"
        >
          <Image
            src="/ZUHR_logo_transparent.svg"
            alt="ZUHR"
            width={200}
            height={80}
            priority
            className="h-12 w-auto lg:h-16"
          />
        </Link>

        {/* Search Bar — desktop/tablet */}
        <div className="hidden flex-1 items-center lg:flex">
          <div className="flex w-full items-center overflow-hidden rounded-full border border-border bg-background">
            {/* All Categories */}
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 border-r border-border px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:text-primary"
            >
              <LayoutGrid
                size={16}
                strokeWidth={1.9}
                className="text-muted-foreground"
                aria-hidden="true"
              />
              <span className="hidden xl:inline">All Categories</span>
              <span className="xl:hidden">Categories</span>
            </button>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search products, brands and categories..."
              className="flex-1 bg-transparent px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />

            {/* Search Button */}
            <button
              type="button"
              className="m-1 flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Search size={15} strokeWidth={2.2} aria-hidden="true" />
              <span className="hidden xl:inline">Search</span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0 lg:gap-5">
          {/* Mobile search icon */}
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Search size={16} strokeWidth={1.9} aria-hidden="true" />
          </Link>

          {/* Account */}
          <Link
            href="/account"
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

          {/* Wishlist */}
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="hidden text-muted-foreground transition-colors hover:text-primary lg:block"
          >
            <Heart size={20} strokeWidth={1.9} aria-hidden="true" />
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:h-auto lg:w-auto lg:border-0 lg:hover:text-primary"
          >
            <ShoppingCart size={18} strokeWidth={1.9} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
