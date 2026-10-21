"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import NavLinks from "./NavLinks";
import AccountMenu from "./Accountmenu";


type NavbarProps = {
  onMenuClick?: () => void;
  cartCount?: number;
};

const Navbar = ({ onMenuClick, cartCount = 0 }: NavbarProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/products?search=${encodeURIComponent(q)}`);
    setMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      {/* ============ TOP ROW ============ */}
      <div className="container mx-auto flex items-center gap-3 px-4 py-3 lg:gap-6 lg:px-6">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

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

        {/* Search Bar — desktop */}
        <form
          onSubmit={submitSearch}
          role="search"
          className="hidden flex-1 items-center lg:flex"
        >
          <div className="flex w-full items-center overflow-hidden rounded-full border border-border bg-background focus-within:border-primary/50">
            <Link
              href="/products"
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
            </Link>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search attars, oud, musk..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />

            <button
              type="submit"
              className="m-1 flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Search size={15} strokeWidth={2.2} aria-hidden="true" />
              <span className="hidden xl:inline">Search</span>
            </button>
          </div>
        </form>

        {/* Right Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0 lg:gap-5">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label={mobileSearchOpen ? "Close search" : "Open search"}
            aria-expanded={mobileSearchOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            {mobileSearchOpen ? (
              <X size={16} strokeWidth={1.9} aria-hidden="true" />
            ) : (
              <Search size={16} strokeWidth={1.9} aria-hidden="true" />
            )}
          </button>

          <AccountMenu />

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="hidden text-muted-foreground transition-colors hover:text-primary lg:block"
          >
            <Heart size={20} strokeWidth={1.9} aria-hidden="true" />
          </Link>

          <Link
            href="/cart"
            aria-label={`Cart${cartCount ? `, ${cartCount} items` : ""}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:h-auto lg:w-auto lg:border-0 lg:hover:text-primary"
          >
            <ShoppingCart size={18} strokeWidth={1.9} aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground lg:-right-2 lg:-top-2">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ============ MOBILE SEARCH ROW ============ */}
      {mobileSearchOpen && (
        <form
          onSubmit={submitSearch}
          role="search"
          className="border-t border-border px-4 py-3 lg:hidden"
        >
          <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2.5">
            <Search
              size={18}
              className="mr-2 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              autoFocus
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search attars..."
              aria-label="Search products"
              className="w-full bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>
        </form>
      )}

      {/* ============ BOTTOM ROW ============ */}
      <div className="hidden border-t border-border lg:block">
        <div className="container mx-auto px-6">
          <NavLinks />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
