"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Package,
  Star,
  LayoutDashboard,
  LogOut,
  Loader2,
  Settings,
} from "lucide-react";
import { NAV_LINKS, SIDEBAR_DATA, categoryHref } from "./navbar/NavData";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSignOut } from "@/hooks/Usesignout";
import { ROUTES } from "./navbar/Accountmenu";

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

type View = "categories" | "menu";

const accountLinkClass =
  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-primary";

const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
  const [navView, setNavView] = useState<View>("categories");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { data: user, isLoading: userLoading, isAdmin } = useCurrentUser();
  const { signOut, isPending: signingOut } = useSignOut();

  const rootRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  // Closed hole inert (focus soriye dey + screen reader/keyboard theke hide kore).
  // Open hole focus close button e, close hole ager element e fire jay.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (isOpen) {
      el.removeAttribute("inert");
      lastFocused.current = document.activeElement as HTMLElement | null;
      closeBtnRef.current?.focus();
    } else {
      el.setAttribute("inert", "");
      lastFocused.current?.focus?.();
      lastFocused.current = null;
    }
  }, [isOpen]);

  // Scroll lock + Escape + desktop size e gele auto close
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) onClose();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, onClose]);

  const toggleCat = (name: string) =>
    setExpandedCat((prev) => (prev === name ? null : name));

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    setSearchQuery("");
    onClose();
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className={`fixed inset-0 z-[100] transition-[opacity,visibility] duration-300 lg:hidden ${
        isOpen ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`absolute bottom-0 left-0 top-0 flex w-[85%] max-w-[360px] flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <Link href="/" aria-label="Home" onClick={onClose}>
            <Image
              src="/ZUHR_logo_transparent.svg"
              alt="ZUHR"
              width={200}
              height={80}
              className="h-10 w-auto"
            />
          </Link>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border bg-muted/30 px-5 py-4">
          <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2.5 shadow-sm">
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search"
              className="mr-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <Search size={18} />
            </button>
            <input
              type="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search attars..."
              aria-label="Search products"
              // 16px: iOS e focus korle auto-zoom hoy na
              className="w-full bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:appearance-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" className="flex border-b border-border bg-card">
          {(["categories", "menu"] as const).map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={navView === view}
              onClick={() => setNavView(view)}
              className={`flex-1 border-b-2 py-3 text-center text-[14px] font-bold transition-colors ${
                navView === view
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {view === "categories" ? "Categories" : "Main Menu"}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-background pb-6">
          {navView === "categories" && (
            <div className="flex flex-col">
              {Object.entries(SIDEBAR_DATA).map(([item, data]) => {
                const Icon = data.icon;
                const isExpanded = expandedCat === item;
                return (
                  <div key={item} className="border-b border-border/50">
                    <button
                      type="button"
                      onClick={() => toggleCat(item)}
                      aria-expanded={isExpanded}
                      className={`flex w-full items-center justify-between px-5 py-4 transition-colors ${
                        isExpanded ? "bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={isExpanded ? 2.5 : 1.75}
                          className={
                            isExpanded
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        />
                        <span
                          className={`text-left text-[14px] font-semibold ${
                            isExpanded ? "text-primary" : "text-foreground/80"
                          }`}
                        >
                          {item}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-muted-foreground transition-transform duration-300 ${
                          isExpanded ? "-rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-in-out ${
                        isExpanded
                          ? "visible grid-rows-[1fr] opacity-100"
                          : "invisible grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="bg-card px-5 pb-4 pt-1">
                          <Link
                            href={categoryHref(item)}
                            onClick={onClose}
                            className="mb-2 ml-8 mt-2 inline-block text-[13px] font-semibold text-primary"
                          >
                            View all {item}
                          </Link>

                          {data.brands && data.brands.length > 0 && (
                            <DrawerSection
                              title="Brands"
                              items={data.brands}
                              hrefFor={(brand) => categoryHref(item, { brand })}
                              onNavigate={onClose}
                            />
                          )}

                          <DrawerSection
                            title="Explore"
                            items={data.departments}
                            hrefFor={(department) =>
                              categoryHref(item, { department })
                            }
                            onNavigate={onClose}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {navView === "menu" && (
            <div className="flex flex-col py-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={onClose}
                  className="flex items-center justify-between border-b border-border/50 px-5 py-4 text-[15px] font-semibold text-foreground/80 transition-colors hover:bg-muted/50 hover:text-primary"
                >
                  <span>{link.name}</span>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground/50"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer (iPhone safe area soho). Chhoto screen e account link beshi hole nijei scroll hoy */}
        <div className="max-h-[50%] space-y-4 overflow-y-auto border-t border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {userLoading ? (
            <div
              className="h-11 animate-pulse rounded-xl bg-muted"
              aria-hidden="true"
            />
          ) : user ? (
            <div>
              <div className="mb-2 flex items-center gap-3 px-1">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                  <User size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {user.name}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              <nav aria-label="Account">
                {isAdmin && (
                  <Link
                    href={ROUTES.profile}
                    onClick={onClose}
                    className={accountLinkClass}
                  >
                    <Settings size={17} aria-hidden="true" />
                    Profile settings
                  </Link>
                )}
                <Link
                  href={ROUTES.orders}
                  onClick={onClose}
                  className={accountLinkClass}
                >
                  <Package size={17} aria-hidden="true" />
                  Order history
                </Link>
                <Link
                  href={ROUTES.reviews}
                  onClick={onClose}
                  className={accountLinkClass}
                >
                  <Star size={17} aria-hidden="true" />
                  Reviews and ratings
                </Link>
                <button
                  type="button"
                  onClick={() => signOut(onClose)}
                  disabled={signingOut}
                  className={`${accountLinkClass} w-full disabled:opacity-60`}
                >
                  {signingOut ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <LogOut size={17} aria-hidden="true" />
                  )}
                  Sign out
                </button>
              </nav>
            </div>
          ) : (
            <Link
              href={ROUTES.login}
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[14px] font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <User size={18} />
              Sign In / Register
            </Link>
          )}

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] font-semibold text-muted-foreground">
            <Link
              href="/wishlist"
              onClick={onClose}
              className="hover:text-primary"
            >
              Wishlist
            </Link>
            <span aria-hidden="true">|</span>
            <Link
              href="/contact"
              onClick={onClose}
              className="hover:text-primary"
            >
              Help Center
            </Link>
            <span aria-hidden="true">|</span>
            <Link
              href="/track-order"
              onClick={onClose}
              className="hover:text-primary"
            >
              Track Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const DrawerSection = ({
  title,
  items,
  hrefFor,
  onNavigate,
}: {
  title: string;
  items: string[];
  hrefFor: (item: string) => string;
  onNavigate: () => void;
}) => (
  <div className="mb-4">
    <h5 className="mb-2 ml-8 mt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      {title}
    </h5>
    <ul className="ml-8 space-y-1 border-l-2 border-border pl-3">
      {items.map((item) => (
        <li key={item}>
          <Link
            href={hrefFor(item)}
            onClick={onNavigate}
            className="block py-2 text-[13px] font-medium text-foreground/70 hover:text-primary"
          >
            {item}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default MobileDrawer;
