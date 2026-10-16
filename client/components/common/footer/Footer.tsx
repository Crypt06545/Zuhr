"use client";

import Link from "next/link";
import {

  MapPin,
  Phone,
  Mail,
  Send,
  Globe,
} from "lucide-react";

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
      { label: "Shipping Info", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
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
    <footer className="mt-20 border-t border-border bg-card">
      {/* Top Section */}
      <div className="container mx-auto px-4 py-12 lg:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              aria-label="Home"
              className="inline-flex items-center"
            >
              <svg
                width="120"
                height="40"
                viewBox="0 0 120 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-auto"
                aria-hidden="true"
              >
                <rect
                  x="1"
                  y="1"
                  width="118"
                  height="38"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-primary"
                />
                <text
                  x="60"
                  y="26"
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="700"
                  fill="currentColor"
                  className="text-primary"
                >
                  LOGO
                </text>
              </svg>
            </Link>

            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Your trusted destination for premium products at unbeatable
              prices. Fast delivery, easy returns, and 24/7 support.
            </p>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="mb-2 text-[13px] font-semibold text-foreground">
                Subscribe to our newsletter
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex w-full max-w-sm items-center overflow-hidden rounded-full border border-border bg-background"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Send size={15} strokeWidth={2} aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 lg:col-start-6">
            {Object.entries(FOOTER_LINKS).map(([key, section]) => (
              <div key={key}>
                <h3 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-foreground">
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-foreground">
              Contact
            </h3>
            <ul className="space-y-3 text-[13px] text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin
                  size={16}
                  strokeWidth={1.9}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  123 Gulshan Avenue, Dhaka 1212,
                  <br />
                  Bangladesh
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone
                  size={16}
                  strokeWidth={1.9}
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
              <li className="flex items-center gap-2.5">
                <Mail
                  size={16}
                  strokeWidth={1.9}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
                <a
                  href="mailto:support@example.com"
                  className="transition-colors hover:text-primary"
                >
                  support@example.com
                </a>
              </li>
            </ul>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-[12px] text-muted-foreground sm:flex-row lg:px-6">
          <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>

          <div className="flex items-center gap-4">
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
            <Link
              href="/sitemap"
              className="transition-colors hover:text-primary"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav space */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </footer>
  );
};

export default Footer;
