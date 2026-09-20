"use client";

import { X } from "lucide-react";

const CartSidebar = ({ open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 flex items-center justify-center">
          <p className="text-sm text-gray-500">Cart is empty</p>
        </div>
      </aside>
    </div>
  );
};

export default CartSidebar;
