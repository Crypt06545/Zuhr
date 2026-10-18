"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./NavData";

const NavLinks = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex h-12 items-center gap-8">
      {NAV_LINKS.map((link) => {
        // "/products-old" ke "/products" er active dhorbe na
        const isActive =
          link.path === "/"
            ? pathname === "/"
            : pathname === link.path || pathname.startsWith(`${link.path}/`);

        return (
          <Link
            key={link.path}
            href={link.path}
            aria-current={isActive ? "page" : undefined}
            className="group relative block h-6 overflow-hidden text-[14px] font-bold leading-6 tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
          >
            <span className="flex flex-col transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-6 group-focus-visible:-translate-y-6 motion-reduce:transition-none">
              <span
                className={`block h-6 ${
                  isActive ? "text-primary" : "text-foreground/80"
                }`}
              >
                {link.name}
              </span>
              <span className="block h-6 text-primary" aria-hidden="true">
                {link.name}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default NavLinks;
