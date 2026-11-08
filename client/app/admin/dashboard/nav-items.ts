import {
  LayoutDashboard,
  Package,
  Ribbon,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

export const BRAND_NAME = "ZUHR";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/dashboard/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/dashboard/products", icon: Package },
  { label: "Expenses", href: "/admin/dashboard/expenses", icon: Wallet },
  { label: "Coupons", href: "/admin/dashboard/coupons", icon: Ribbon },
  { label: "Customers", href: "/admin/dashboard/customers", icon: Users },
  { label: "Settings", href: "/admin/dashboard/settings", icon: Settings },
];
