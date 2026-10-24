"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  apiErrorMessage,
  apiErrorStatus,
  createOrderApi,
} from "@/lib/api/orders.api";
import {
  DEFAULT_VALUES,
  buildCreateOrderBody,
  newIdempotencyKey,
  type CheckoutFormValues,
} from "@/lib/checkout";
import { useCartStore } from "@/store/cart-store";

import AddressSection from "./AddressSection";
import ConfirmButton from "./ConfirmButton";
import ContactSection from "./ContactSection";
import OrderSummary from "./OrderSummary";
import PaymentSection from "./PaymentSection";

/* ============================================================
   লোড হওয়ার সময়, খালি cart, অর্ডার হয়ে যাওয়ার পর
   ============================================================ */

const CheckoutSkeleton = () => (
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
    <div className="space-y-6">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-56 animate-pulse rounded-xl bg-muted/40" />
      ))}
    </div>
    <div className="h-80 animate-pulse rounded-xl bg-muted/40" />
  </div>
);

const EmptyCheckout = () => (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <ShoppingBag className="h-7 w-7" aria-hidden="true" />
    </span>
    <h2 className="text-lg font-semibold">Your cart is empty</h2>
    <p className="mb-5 mt-1 max-w-sm text-sm text-muted-foreground">
      Add something to your cart before you check out.
    </p>
    <Link
      href="/products"
      className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
    >
      Start shopping
    </Link>
  </div>
);

// cart খালি হওয়ার পর থেকে নতুন পেজ খোলা পর্যন্ত "Your cart is empty" যেন ঝলক না দেয়
const PlacedRedirect = () => (
  <div className="flex flex-col items-center gap-3 py-24 text-sm text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
    Order placed. Taking you to your confirmation...
  </div>
);

/* ============================================================
   ফর্ম (cart-এ আইটেম থাকলেই আঁকা হয়)
   ============================================================ */

const CheckoutForm = ({ onPlaced }: { onPlaced: () => void }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const items = useCartStore((state) => state.items);
  const { data: user } = useCurrentUser();

  // এই চেষ্টার key: ব্যর্থ হয়ে আবার চাপলেও একই key যায়, তাই কখনো দুটো অর্ডার হয় না
  const idempotencyKey = useRef(newIdempotencyKey());

  const methods = useForm<CheckoutFormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched", // ঘর ছাড়ার পর যাচাই, তারপর টাইপ করতে করতে
  });

  const { handleSubmit, getValues, setValue, setError, setFocus } = methods;

  // নাম আগে থেকে বসাই (ব্যবহারকারী যা লিখেছে তা মুছি না)
  useEffect(() => {
    if (user && !getValues("fullName")) setValue("fullName", user.name);
  }, [user, getValues, setValue]);

  const onSubmit = async (values: CheckoutFormValues) => {
    try {
      const order = await createOrderApi(
        buildCreateOrderBody(values, items),
        idempotencyKey.current,
      );

      onPlaced();
      useCartStore.getState().clear();
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });

      router.replace(`/checkout/success/${order._id}`);
    } catch (error) {
      const message = apiErrorMessage(
        error,
        "We could not place your order. Please try again.",
      );

      // একই Transaction ID আগে ব্যবহার হয়ে থাকলে ওই ঘরেই দেখাই
      if (apiErrorStatus(error) === 409 && /transaction id/i.test(message)) {
        setError("transactionId", { type: "server", message });
        setFocus("transactionId");
        return;
      }

      toast.error(message);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_440px]"
      >
        <div className="min-w-0 space-y-6">
          <ContactSection />
          <AddressSection />
          <PaymentSection />

          {/* ফোনে বাটন ফর্মের শেষে */}
          <div className="lg:hidden">
            <ConfirmButton />
          </div>
        </div>

        <OrderSummary />
      </form>
    </FormProvider>
  );
};

/* ============================================================
   পেজ
   ============================================================ */

const CheckoutView = () => {
  const hydrated = useCartStore((state) => state.hydrated);
  const hasItems = useCartStore((state) => state.items.length > 0);
  const [placed, setPlaced] = useState(false);

  // cart localStorage থেকে পড়া না হলে নিজেই পড়ি (Navbar থাকলে সে-ই করে, দুবার করলে ক্ষতি নেই)
  useEffect(() => {
    if (!useCartStore.getState().hydrated) {
      useCartStore.persist.rehydrate();
    }
  }, []);

  return (
    <main className="container mx-auto px-4 py-6 lg:px-6 lg:py-10">
      <header className="mb-6 lg:mb-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex items-center gap-2 text-[12px] text-muted-foreground sm:text-[13px]"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/products"
            className="transition-colors hover:text-primary"
          >
            Products
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Checkout</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Checkout
        </h1>
      </header>

      {placed ? (
        <PlacedRedirect />
      ) : !hydrated ? (
        <CheckoutSkeleton />
      ) : hasItems ? (
        <CheckoutForm onPlaced={() => setPlaced(true)} />
      ) : (
        <EmptyCheckout />
      )}
    </main>
  );
};

export default CheckoutView;
