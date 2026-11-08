"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Heart, Menu, X } from "lucide-react";

import NavLinks from "./NavLinks";
import AccountMenu from "./Accountmenu";
import SearchBox from "./SearchBox";
import CartButton from "@/components/cart/Cartbutton";
import CartDrawer from "@/components/cart/Cartdrawer";

type NavbarProps = {
  onMenuClick?: () => void;
};

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <>
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
          <SearchBox variant="desktop" />

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

            {/* Cart: পেজে না গিয়ে পাশের drawer খোলে */}
            <CartButton />
          </div>
        </div>

        {/* ============ MOBILE SEARCH ROW ============ */}
        {mobileSearchOpen && (
          <SearchBox
            variant="mobile"
            onDone={() => setMobileSearchOpen(false)}
          />
        )}

        {/* ============ BOTTOM ROW ============ */}
        <div className="hidden border-t border-border lg:block">
          <div className="container mx-auto px-6">
            <NavLinks />
          </div>
        </div>
      </header>

      <CartDrawer />
    </>
  );
};

export default Navbar;
