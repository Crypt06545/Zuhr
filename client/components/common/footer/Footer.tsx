"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Send } from "lucide-react";

type IconProps = SVGProps<SVGSVGElement>;

const FacebookIcon = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
    />
  </svg>
);

const InstagramIcon = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    {...props}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8A4 4 0 0 1 16 11.37m1.5-4.87h.01" />
    </g>
  </svg>
);

const TiktokIcon = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="currentColor"
      d="M20.357 7.75a.537.537 0 0 0-.495-.516a4.7 4.7 0 0 1-2.415-.938a4.85 4.85 0 0 1-1.887-3.3a.54.54 0 0 0-.517-.496h-2.108a.517.517 0 0 0-.517.527v12.59a2.794 2.794 0 0 1-2.974 2.762a2.815 2.815 0 0 1-2.51-3.711A2.836 2.836 0 0 1 9.93 12.78a.506.506 0 0 0 .558-.506V9.807s-.896-.063-1.202-.063a5.27 5.27 0 0 0-4.101 1.93a5.8 5.8 0 0 0-1.37 2.52a5.86 5.86 0 0 0 2.14 6.072A5.93 5.93 0 0 0 9.591 21.5q.451 0 .896-.063A5.95 5.95 0 0 0 13.8 19.78a5.84 5.84 0 0 0 1.75-4.133V8.71a7.84 7.84 0 0 0 4.218 1.613a.517.517 0 0 0 .548-.527V7.751z"
    />
  </svg>
);

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

const SOCIALS: {
  icon: ComponentType<IconProps>;
  label: string;
  href: string;
}[] = [
  {
    icon: FacebookIcon,
    label: "Facebook",
    href: "https://www.facebook.com/zuhrbdperfume",
  },
  {
    icon: InstagramIcon,
    label: "Instagram",
    href: "https://www.instagram.com/zuhr.bd",
  },
  { icon: TiktokIcon, label: "TikTok", href: "https://tiktok.com" },
];

const Footer = () => {
  return (
    <footer className="mt-12 border-t border-border bg-card">
      {/* ============ TOP ============ */}
      <div className="container mx-auto px-4 py-10 lg:px-6 lg:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
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
                className="h-10 w-auto"
              />
            </Link>

            <p className="mt-4 max-w-xs text-[13.5px] font-medium leading-relaxed text-foreground/70">
              Premium products at unbeatable prices. Fast delivery, easy
              returns, 24/7 support.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 flex w-full max-w-xs items-center overflow-hidden rounded-full border border-border bg-background"
            >
              <input
                type="email"
                placeholder="Your email"
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Send size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* Links — 3 columns on mobile too */}
          <div className="grid grid-cols-3 gap-6 lg:col-span-5 lg:gap-8">
            {Object.entries(FOOTER_LINKS).map(([key, section]) => (
              <div key={key}>
                <h3 className="mb-3.5 text-[12px] font-bold uppercase tracking-wider text-foreground">
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[13px] font-medium text-foreground/70 transition-colors hover:text-primary"
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
            <h3 className="mb-3.5 text-[12px] font-bold uppercase tracking-wider text-foreground">
              Get in Touch
            </h3>
            <ul className="space-y-3 text-[13px] font-medium text-foreground/70">
              <li className="flex items-start gap-2.5">
                <MapPin
                  size={15}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>123 Gulshan Avenue, Dhaka 1212</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone
                  size={15}
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
              <li className="flex items-center gap-2.5">
                <Mail
                  size={15}
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

            <div className="mt-5 flex items-center gap-2.5">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground/60 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  <Icon width={15} height={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============ BOTTOM BAR ============ */}
      <div className="border-t border-border/80">
        <div className="container mx-auto flex flex-col items-center gap-2.5 px-4 py-4 text-[12px] font-medium text-foreground/60 sm:flex-row sm:justify-between lg:px-6">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} ZUHR. All rights reserved.
          </p>

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
          </div>
        </div>
      </div>

      {/* Space for mobile bottom nav — 68px bar + 31px floating cart = ~100px */}
      <div className="h-28 lg:hidden" aria-hidden="true" />
    </footer>
  );
};

export default Footer;
