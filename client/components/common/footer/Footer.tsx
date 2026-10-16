"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Send, Globe } from "lucide-react";

const FOOTER_LINKS = {
  shop: {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "New Arrivals", href: "/products?sort=new" },
      { label: "Best Sellers", href: "/products?sort=best" },
      { label: "Sale", href: "/products?sale=true" },
      { label: "Gift Cards", href: "/gift-cards" },
    ],
  },
  help: {
    title: "Help",
    links: [
      { label: "Track Order", href: "/track-order" },
      { label: "Returns", href: "/returns" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
} as const;

const SOCIALS = [
  { icon: Globe, label: "Facebook", href: "https://facebook.com" },
  { icon: Globe, label: "Instagram", href: "https://instagram.com" },
  { icon: Globe, label: "Twitter", href: "https://twitter.com" },
  { icon: Globe, label: "YouTube", href: "https://youtube.com" },
] as const;

const Footer = () => {
  return (
    <footer className="mt-12 border-t border-border bg-card">
      {/* ============ TOP ============ */}
      <div className="container mx-auto px-4 py-8 lg:px-6 lg:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              aria-label="Home"
              className="inline-flex items-center transition-opacity hover:opacity-80"
            >
              <Image
                src="/ZUHR_logo_transparent.svg"
                alt="ZUHR"
                width={200}
                height={100}
                className="h-9 w-auto"
              />
            </Link>

            <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
              Premium products at unbeatable prices. Fast delivery, easy
              returns, 24/7 support.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-4 flex w-full max-w-xs items-center overflow-hidden rounded-full border border-border bg-background"
            >
              <input
                type="email"
                placeholder="Your email"
                className="min-w-0 flex-1 bg-transparent px-3.5 py-2 text-[12.5px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Send size={13} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* Links — 3 columns on mobile too */}
          <div className="grid grid-cols-3 gap-4 lg:col-span-5 lg:gap-6">
            {Object.entries(FOOTER_LINKS).map(([key, section]) => (
              <div key={key}>
                <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-foreground">
                  {section.title}
                </h3>
                <ul className="space-y-1.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[12px] text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact + Socials */}
          <div className="lg:col-span-3">
            <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-foreground">
              Get in Touch
            </h3>
            <ul className="space-y-2 text-[12px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin
                  size={13}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>123 Gulshan Avenue, Dhaka 1212</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone
                  size={13}
                  strokeWidth={2}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
                <a
                  href="tel:+8801700000000"
                  className="transition-colors hover:text-primary"
                >
                  +880 1700-000000
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail
                  size={13}
                  strokeWidth={2}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
                <a
                  href="mailto:support@example.com"
                  className="truncate transition-colors hover:text-primary"
                >
                  support@example.com
                </a>
              </li>
            </ul>

            <div className="mt-4 flex items-center gap-2">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon size={13} strokeWidth={2} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============ BOTTOM BAR ============ */}
      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-3.5 text-[11.5px] text-muted-foreground sm:flex-row sm:justify-between lg:px-6">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} ZUHR. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <span aria-hidden="true" className="text-border">
              •
            </span>
            <Link
              href="/terms"
              className="transition-colors hover:text-primary"
            >
              Terms
            </Link>
            <span aria-hidden="true" className="text-border">
              •
            </span>
            
          </div>
        </div>
      </div>

      {/* Space for mobile bottom nav — 68px bar + 31px floating cart = ~100px */}
      <div className="h-28 lg:hidden" aria-hidden="true" />
    </footer>
  );
};

export default Footer;
