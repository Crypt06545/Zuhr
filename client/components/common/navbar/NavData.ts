import {
  Sparkles,
  Trees,
  Flower2,
  Gem,
  Wind,
  Gift,
  Flame,
  type LucideIcon,
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

export type NavLink = {
  name: string;
  path: string;
};

export type SidebarCategory = {
  icon: LucideIcon;
  /** Optional: khali thakle brand column hide hobe */
  brands?: string[];
  departments: string[];
};

/* ============================================================
   MAIN NAV
   ============================================================ */

export const NAV_LINKS: NavLink[] = [
  { name: "Home", path: "/" },
  { name: "Shop All", path: "/products" },
  { name: "About Us", path: "/about" },
  { name: "Contact", path: "/contact" },
  { name: "FAQ", path: "/faq" },
];

/* ============================================================
   CATEGORIES (Sidebar + Mega Menu + Mobile Drawer)
   ============================================================ */

export const ALL_CATEGORY = "All Attars";

export const SIDEBAR_DATA: Record<string, SidebarCategory> = {
  [ALL_CATEGORY]: {
    icon: Sparkles,
    departments: ["Best Sellers", "New Arrivals", "Alcohol-Free"],
  },
  "Oud & Woody": {
    icon: Trees,
    departments: ["Cambodi Oud", "Hindi Oud", "Sandalwood"],
  },
  "Floral & Rose": {
    icon: Flower2,
    departments: ["Taif Rose", "Jasmine"],
  },
  "Musk & Amber": {
    icon: Gem,
    departments: ["White Musk", "Black Musk", "Amber Oud"],
  },
  "Fresh & Citrus": {
    icon: Wind,
    departments: ["Lemon", "Bergamot", "Oceanic"],
  },
  "Gift Sets": {
    icon: Gift,
    departments: ["For Him", "For Her", "Premium Box"],
  },
  "Bakhoor & Incense": {
    icon: Flame,
    departments: ["Oud Bakhoor", "Incense Sticks"],
  },
};

/** Sidebar er prothom category (default active) */
export const DEFAULT_CATEGORY = Object.keys(SIDEBAR_DATA)[0];

/* ============================================================
   HELPERS
   ============================================================ */

export const categoryHref = (
  category: string,
  filter?: { brand?: string; department?: string },
) => {
  const params = new URLSearchParams();

  // "All Attars" e category filter lage na
  if (category !== ALL_CATEGORY) params.set("category", category);
  if (filter?.brand) params.set("brand", filter.brand);
  if (filter?.department) params.set("department", filter.department);

  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
};
