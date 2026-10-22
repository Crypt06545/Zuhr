// store/cart-store.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/* ============================================================
   TYPES
   ============================================================ */

// Cart-এ যা থাকে তা শুধু দেখানোর জন্য (ছবি, নাম, দাম)।
// আসল দাম ও স্টক checkout-এ সার্ভার নিজে যাচাই করে, তাই এখানে দাম বদলালেও কেউ কম দামে কিনতে পারে না।
export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image?: string;
  size: string;
  color?: string;
  unitPrice: number;
  compareAtPrice?: number;
  quantity: number;
};

export type AddItemInput = Omit<CartItem, "quantity">;

export const MAX_QTY_PER_ITEM = 10;
export const CART_STORAGE_KEY = "zuhr-cart";
export const CHECKOUT_HREF = "/checkout";

export const cartKey = (productId: string, variantId: string) =>
  `${productId}:${variantId}`;

export const itemKey = (item: Pick<CartItem, "productId" | "variantId">) =>
  cartKey(item.productId, item.variantId);

// localStorage-এ হাত দিয়ে ভুল ডাটা বসালে বা পুরনো ফরম্যাট থাকলে UI যেন না ভাঙে
const isValidItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.productId === "string" &&
    typeof item.variantId === "string" &&
    typeof item.name === "string" &&
    typeof item.slug === "string" &&
    typeof item.size === "string" &&
    typeof item.unitPrice === "number" &&
    Number.isFinite(item.unitPrice) &&
    item.unitPrice >= 0 &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= MAX_QTY_PER_ITEM
  );
};

/* ============================================================
   CART STORE (localStorage-এ থাকে, reload-এও হারায় না)
   ============================================================ */

type CartState = {
  items: CartItem[];
  hydrated: boolean; // localStorage থেকে পড়া শেষ হয়েছে কিনা (SSR mismatch এড়াতে)
  addItem: (
    input: AddItemInput,
    quantity?: number,
  ) => { status: "added" | "limit"; quantity: number };
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      addItem: (input, quantity = 1) => {
        const key = itemKey(input);
        const existing = get().items.find((item) => itemKey(item) === key);
        const wanted = (existing?.quantity ?? 0) + quantity;
        const next = Math.min(MAX_QTY_PER_ITEM, wanted);

        set((state) => ({
          items: existing
            ? state.items.map((item) =>
                // নতুন snapshot দিয়ে নাম-দাম-ছবি হালনাগাদ হয়
                itemKey(item) === key
                  ? { ...item, ...input, quantity: next }
                  : item,
              )
            : [...state.items, { ...input, quantity: next }],
        }));

        return {
          status:
            wanted > MAX_QTY_PER_ITEM ? ("limit" as const) : ("added" as const),
          quantity: next, // এই আইটেম এখন cart-এ মোট কতটা
        };
      },

      setQuantity: (key, quantity) =>
        set((state) => {
          if (quantity < 1) {
            return { items: state.items.filter((i) => itemKey(i) !== key) };
          }

          const safe = Math.min(MAX_QTY_PER_ITEM, Math.floor(quantity));

          return {
            items: state.items.map((item) =>
              itemKey(item) === key ? { ...item, quantity: safe } : item,
            ),
          };
        }),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((item) => itemKey(item) !== key),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // SSR-এ localStorage নেই: প্রথম রেন্ডারে খালি, তারপর CartDrawer নিজে rehydrate() চালায়
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const items = (persisted as { items?: unknown } | null)?.items;

        return {
          ...current,
          items: Array.isArray(items)
            ? items.filter(isValidItem)
            : current.items,
        };
      },
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hydrated: true });
      },
    },
  ),
);

/* ============================================================
   DRAWER OPEN/CLOSE (আলাদা, localStorage-এ যায় না)
   ============================================================ */

type CartUiState = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
};

export const useCartUi = create<CartUiState>()((set) => ({
  open: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
}));

/* ============================================================
   SELECTORS
   ============================================================ */

// Hydrate হওয়ার আগে 0 দেখায়, তাই server আর client-এর প্রথম রেন্ডার একই থাকে
export const useCartCount = () =>
  useCartStore((state) =>
    state.hydrated
      ? state.items.reduce((total, item) => total + item.quantity, 0)
      : 0,
  );

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

export const cartSavings = (items: CartItem[]) =>
  items.reduce((total, item) => {
    const compare = item.compareAtPrice ?? 0;

    return compare > item.unitPrice
      ? total + (compare - item.unitPrice) * item.quantity
      : total;
  }, 0);
