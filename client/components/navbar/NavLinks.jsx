"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./NavData";

const NavLinks = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-8 py-3 h-12 overflow-hidden">
      {NAV_LINKS.map((link) => {
        const isActive =
          link.path === "/" ? pathname === "/" : pathname.startsWith(link.path);

        return (
          <Link
            key={link.path}
            href={link.path}
            className="relative h-6 overflow-hidden group"
          >
            {/* Normal Text */}
            <span
              className={`block text-[14px] font-bold tracking-wide transition-transform duration-200 group-hover:-translate-y-full ${
                isActive ? "text-orange-600" : "text-gray-700"
              }`}
            >
              {link.name}
            </span>

            {/* Hover Text */}
            <span className="absolute top-full left-0 block text-[14px] font-bold tracking-wide text-orange-600 transition-transform duration-200 group-hover:-translate-y-full">
              {link.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default NavLinks;
