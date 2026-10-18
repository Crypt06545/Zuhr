"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SIDEBAR_DATA, DEFAULT_CATEGORY, categoryHref } from "./navbar/NavData";

const HIDE_DELAY = 150;

const MegaMenuSidebar = () => {
  const [activeCat, setActiveCat] = useState(DEFAULT_CATEGORY);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverSidebar = useRef(false);
  const isOverFlyout = useRef(false);

  const clearHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => {
      if (!isOverSidebar.current && !isOverFlyout.current) {
        setFlyoutOpen(false);
      }
    }, HIDE_DELAY);
  }, [clearHide]);

  const onSidebarEnter = useCallback(() => {
    isOverSidebar.current = true;
    clearHide();
    setFlyoutOpen(true);
  }, [clearHide]);

  const onSidebarLeave = useCallback(() => {
    isOverSidebar.current = false;
    scheduleHide();
  }, [scheduleHide]);

  const onFlyoutEnter = useCallback(() => {
    isOverFlyout.current = true;
    clearHide();
  }, [clearHide]);

  const onFlyoutLeave = useCallback(() => {
    isOverFlyout.current = false;
    scheduleHide();
  }, [scheduleHide]);

  const closeNow = useCallback(() => {
    clearHide();
    isOverSidebar.current = false;
    isOverFlyout.current = false;
    setFlyoutOpen(false);
  }, [clearHide]);

  useEffect(() => clearHide, [clearHide]);

  const current = SIDEBAR_DATA[activeCat];
  const hasBrands = !!current?.brands?.length;

  return (
    <div
      className="relative z-30 hidden w-72 flex-shrink-0 self-stretch lg:block"
      onKeyDown={(e) => e.key === "Escape" && closeNow()}
    >
      {/* Sidebar Card */}
      <nav
        aria-label="Categories"
        onMouseEnter={onSidebarEnter}
        onMouseLeave={onSidebarLeave}
        onFocus={onSidebarEnter}
        onBlur={onSidebarLeave}
        className="flex h-full min-h-[480px] w-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Shop by Category
        </p>

        <ul className="space-y-1">
          {Object.entries(SIDEBAR_DATA).map(([item, data]) => {
            const Icon = data.icon;
            const isActive = activeCat === item;

            return (
              <li key={item}>
                <Link
                  href={categoryHref(item)}
                  onClick={closeNow}
                  onMouseEnter={() => setActiveCat(item)}
                  onFocus={() => setActiveCat(item)}
                  className={`flex items-center justify-between rounded-xl px-3 py-3 text-[14px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-muted hover:text-primary"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 1.75}
                      className={`shrink-0 ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item}</span>
                  </span>
                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className={`shrink-0 transition-all duration-300 ${
                      isActive
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-2 opacity-0"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Niche pin kora CTA: category kom thakleo sidebar bhora dekhay */}
        <Link
          href="/products"
          onClick={closeNow}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          View All Products
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </nav>

      {/* Invisible Bridge */}
      {flyoutOpen && (
        <div
          onMouseEnter={onFlyoutEnter}
          onMouseLeave={onFlyoutLeave}
          className="absolute left-full top-0 h-full w-3"
        />
      )}

      {/* Flyout Panel */}
      <div
        onMouseEnter={onFlyoutEnter}
        onMouseLeave={onFlyoutLeave}
        onFocus={onFlyoutEnter}
        onBlur={onFlyoutLeave}
        className={`absolute left-full top-0 ml-3 grid min-h-full content-start gap-6 rounded-2xl border border-border bg-card p-6 shadow-xl transition-[opacity,transform,visibility] duration-200 ease-out ${
          hasBrands ? "w-[460px] grid-cols-2" : "w-[260px] grid-cols-1"
        } ${
          flyoutOpen
            ? "visible translate-x-0 opacity-100"
            : "pointer-events-none invisible translate-x-2 opacity-0"
        }`}
      >
        {hasBrands && (
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Brands
            </h4>
            <ul className="space-y-3">
              {current.brands!.map((brand) => (
                <li key={brand}>
                  <Link
                    href={categoryHref(activeCat, { brand })}
                    onClick={closeNow}
                    className="group/item flex items-center justify-between text-[14px] font-medium text-foreground/80 outline-none transition-colors hover:text-primary focus-visible:text-primary"
                  >
                    <span>{brand}</span>
                    <ChevronRight
                      size={12}
                      aria-hidden="true"
                      className="text-muted-foreground/50 transition-colors group-hover/item:text-primary"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={hasBrands ? "border-l border-border pl-6" : ""}>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Explore
          </h4>
          <ul className="space-y-3">
            {current?.departments.map((department) => (
              <li key={department}>
                <Link
                  href={categoryHref(activeCat, { department })}
                  onClick={closeNow}
                  className="group/item flex items-center justify-between text-[14px] font-medium text-foreground/80 outline-none transition-colors hover:text-primary focus-visible:text-primary"
                >
                  <span>{department}</span>
                  <ChevronRight
                    size={12}
                    aria-hidden="true"
                    className="text-muted-foreground/50 transition-colors group-hover/item:text-primary"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MegaMenuSidebar;
