"use client";

import Link from "next/link";
import { useState } from "react";
import { Truck, Gift, Headset, ChevronDown, Globe } from "lucide-react";

const FEATURES = [
  { icon: Truck, text: "Free Shipping on orders over ৳2000" },
  { icon: Gift, text: "Gift Certificates Up To ৳2500" },
  { icon: Headset, text: "24/7 Expert Support" },
] as const;

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "BN", label: "বাংলা" },
] as const;

const UtilityBar = () => {
  const [isLangOpen, setIsLangOpen] = useState(false);

  return (
    <div className="hidden w-full border-b border-border bg-card text-[13px] text-muted-foreground lg:block">
      <div className="container mx-auto flex items-center justify-between px-4 py-2 lg:px-6">
        {/* Left: Features */}
        <div className="flex items-center gap-6">
          {FEATURES.map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <Icon
                size={15}
                strokeWidth={1.9}
                className="shrink-0"
                aria-hidden="true"
              />
              <span>{text}</span>
            </span>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <Link
            href="/track-order"
            className="font-medium transition-colors hover:text-primary"
          >
            Track Order
          </Link>

          <Link
            href="/contact"
            className="font-medium transition-colors hover:text-primary"
          >
            Help Center
          </Link>

          {/* Language Dropdown (Coming Soon) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangOpen((prev) => !prev)}
              onBlur={() => setTimeout(() => setIsLangOpen(false), 150)}
              aria-haspopup="listbox"
              aria-expanded={isLangOpen}
              className="flex cursor-pointer items-center gap-1.5 font-medium transition-colors hover:text-primary"
            >
              <Globe
                size={15}
                strokeWidth={1.9}
                className="shrink-0"
                aria-hidden="true"
              />
              <span>EN</span>
              <ChevronDown
                size={13}
                strokeWidth={2.2}
                className={`shrink-0 transition-transform duration-300 ease-out ${
                  isLangOpen ? "rotate-180" : "rotate-0"
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown — z-[60] diye navbar er (z-50) upore */}
            <div
              role="listbox"
              aria-hidden={!isLangOpen}
              className={`absolute right-0 top-full z-[60] mt-2 w-48 origin-top-right overflow-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-lg transition-all duration-300 ease-out ${
                isLangOpen
                  ? "visible translate-y-0 scale-100 opacity-100"
                  : "invisible -translate-y-1 scale-95 opacity-0"
              }`}
            >
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Coming Soon
              </p>
              <ul>
                {LANGUAGES.map(({ code, label }) => (
                  <li key={code}>
                    <button
                      type="button"
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-between px-3 py-1.5 text-left text-[13px] text-muted-foreground/70"
                    >
                      <span>{label}</span>
                      <span className="text-[11px] uppercase">{code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilityBar;
