"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Heart,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { SIDEBAR_DATA, NAV_LINKS } from "./NavData";

const MobileDrawer = ({ isOpen, onClose }) => {
  const [navView, setNavView] = useState("categories");
  const [expandedCat, setExpandedCat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const user = null; // placeholder
  const isAdmin = user?.role === "Admin";

  const toggleCat = (name) =>
    setExpandedCat((prev) => (prev === name ? null : name));

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const params = new URLSearchParams();
    params.set("search", trimmed);
    router.push(`/products?${params.toString()}`);
    setSearchQuery("");
    onClose();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSignOut = () => {
    onClose();
    router.push("/login");
  };

  return (
    <div
      className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-[360px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded flex items-center justify-center text-white font-black text-lg">
              Z
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              ZUHR
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
            <button
              onClick={handleSearch}
              className="mr-2 text-gray-400 hover:text-orange-600 transition-colors"
            >
              <Search size={18} />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search products..."
              className="w-full text-[14px] bg-transparent outline-none placeholder:text-gray-400 text-gray-800"
            />
          </div>
        </div>

        <div className="flex border-b border-gray-100">
          {["categories", "menu"].map((view) => (
            <button
              key={view}
              onClick={() => setNavView(view)}
              className={`flex-1 py-3 text-[14px] font-bold text-center transition-colors border-b-2 capitalize ${
                navView === view
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {view === "categories" ? "Categories" : "Main Menu"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-white pb-6">
          {navView === "categories" && (
            <div className="flex flex-col">
              {Object.entries(SIDEBAR_DATA).map(([item, data], idx) => {
                const Icon = data.icon;
                const isExpanded = expandedCat === item;
                return (
                  <div key={idx} className="border-b border-gray-50">
                    <button
                      onClick={() => toggleCat(item)}
                      className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                        isExpanded ? "bg-orange-50/50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          strokeWidth={isExpanded ? 2.5 : 1.75}
                          className={
                            isExpanded ? "text-orange-600" : "text-gray-500"
                          }
                        />
                        <span
                          className={`text-[14px] font-semibold ${isExpanded ? "text-orange-600" : "text-gray-700"}`}
                        >
                          {item}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-300 ${isExpanded ? "-rotate-180 text-orange-500" : ""}`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isExpanded
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-4 pt-1 bg-orange-50/20">
                          <DrawerSection title="Brands" items={data.brands} />
                          <DrawerSection
                            title="Departments"
                            items={data.departments}
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
              {user && (
                <>
                  <SectionLabel label="Account" />
                  <MenuLink
                    href="/orders"
                    icon={<Package size={16} />}
                    label="My Orders"
                    onClose={onClose}
                  />
                  <MenuLink
                    href="/wishlist"
                    icon={<Heart size={16} />}
                    label="Wishlist"
                    onClose={onClose}
                  />
                  <MenuLink
                    href="/profile"
                    icon={<Settings size={16} />}
                    label="Profile Settings"
                    onClose={onClose}
                  />
                  {isAdmin && (
                    <>
                      <SectionLabel label="Admin" />
                      <MenuLink
                        href="/admin/dashboard"
                        icon={<LayoutDashboard size={16} />}
                        label="Admin Dashboard"
                        onClose={onClose}
                        highlight
                      />
                    </>
                  )}
                  <SectionLabel label="Explore" />
                </>
              )}

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={onClose}
                  className="px-5 py-3.5 text-[15px] font-semibold text-gray-700 hover:text-orange-600 hover:bg-gray-50 border-b border-gray-50 transition-colors flex justify-between items-center"
                >
                  <span>{link.name}</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? <User size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-[12px] text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white text-red-600 py-3 rounded-xl font-bold text-[14px] hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold text-[14px] hover:bg-orange-600 transition-colors shadow-sm"
            >
              <User size={18} />
              Sign In / Register
            </Link>
          )}

          <div className="flex justify-center gap-6 text-[12px] font-semibold text-gray-500">
            <span className="cursor-pointer hover:text-orange-600">
              Help Center
            </span>
            <span>|</span>
            <span className="cursor-pointer hover:text-orange-600">
              Track Order
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({ label }) => (
  <p className="px-5 pt-4 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
    {label}
  </p>
);

const MenuLink = ({ href, icon, label, onClose, highlight = false }) => (
  <Link
    href={href}
    onClick={onClose}
    className={`px-5 py-3.5 text-[14px] font-semibold border-b border-gray-50 transition-colors flex items-center justify-between ${
      highlight
        ? "text-orange-600 bg-orange-50/40 hover:bg-orange-50"
        : "text-gray-700 hover:text-orange-600 hover:bg-gray-50"
    }`}
  >
    <span className="flex items-center gap-3">
      <span className={highlight ? "text-orange-500" : "text-gray-400"}>
        {icon}
      </span>
      {label}
    </span>
    <ChevronRight
      size={16}
      className={highlight ? "text-orange-300" : "text-gray-300"}
    />
  </Link>
);

const DrawerSection = ({ title, items }) => (
  <div className="mb-4">
    <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2 ml-8">
      {title}
    </h5>
    <ul className="space-y-2 ml-8 border-l-2 border-gray-100 pl-3">
      {items.map((item, i) => (
        <li
          key={i}
          className="text-[13px] text-gray-600 font-medium py-1 cursor-pointer hover:text-orange-600"
        >
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default MobileDrawer;
