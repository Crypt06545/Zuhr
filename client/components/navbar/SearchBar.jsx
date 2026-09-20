"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid } from "lucide-react";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const params = new URLSearchParams();
    params.set("search", trimmed);
    router.push(`/products?${params.toString()}`);
    setQuery("");
  };

  const handleKeyDown = () => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="hidden lg:flex flex-1 max-w-3xl items-center border border-gray-200 rounded-xl bg-[#F8F9FA] h-12 relative pl-2 mx-4">
      <div className="h-full px-4 flex items-center gap-2 text-sm text-gray-700 font-medium whitespace-nowrap">
        <LayoutGrid size={14} className="text-gray-500" />
        All Categories
      </div>

      <span className="h-5 w-[1px] bg-gray-200 self-center" />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search products, brands and categories..."
        className="w-full bg-transparent px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
      />

      <button
        onClick={handleSearch}
        className="h-10 bg-black hover:bg-orange-600 transition-colors px-6 text-white rounded-lg flex items-center gap-2 font-medium text-sm mr-1 shadow-sm"
      >
        <Search size={16} />
        <span>Search</span>
      </button>
    </div>
  );
};

export default SearchBar;
