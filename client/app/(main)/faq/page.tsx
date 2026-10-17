"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Search,
  Plus,
  Minus,
  HelpCircle,
  Truck,
  RefreshCcw,
  Droplet,
  CreditCard,
  User,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

type Category = {
  id: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
};

type Faq = {
  category: string;
  question: string;
  answer: React.ReactNode;
};

/* ============================================================
   DATA
   ============================================================ */

const CATEGORIES: Category[] = [
  { id: "all", label: "All", icon: HelpCircle },
  { id: "orders", label: "Orders & Payment", icon: CreditCard },
  { id: "shipping", label: "Shipping & Delivery", icon: Truck },
  { id: "returns", label: "Returns & Refunds", icon: RefreshCcw },
  { id: "products", label: "Products", icon: Droplet },
  { id: "account", label: "Account", icon: User },
];

const FAQS: Faq[] = [
  /* ---- Orders & Payment ---- */
  {
    category: "orders",
    question: "How do I place an order on ZUHR?",
    answer: (
      <>
        <p>
          Browse our collection, click on the attar you love, and add it to your
          cart. Once you&apos;re ready, go to checkout, enter your delivery
          details, choose a payment method, and confirm your order.
        </p>
        <p className="mt-2">
          You&apos;ll receive an order confirmation via SMS or email within a
          few minutes.
        </p>
      </>
    ),
  },
  {
    category: "orders",
    question: "What payment methods do you accept?",
    answer: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong className="text-foreground">bKash</strong> — instant
          confirmation
        </li>
        <li>
          <strong className="text-foreground">Nagad</strong> — instant
          confirmation
        </li>
        <li>
          <strong className="text-foreground">Debit/Credit Cards</strong> — Visa
          &amp; Mastercard
        </li>
        <li>
          <strong className="text-foreground">Cash on Delivery</strong> —
          available in selected areas
        </li>
      </ul>
    ),
  },
  {
    category: "orders",
    question: "Can I cancel or modify my order after placing it?",
    answer: (
      <p>
        Yes — you can cancel or modify your order within{" "}
        <strong className="text-foreground">2 hours</strong> of placing it,
        provided it hasn&apos;t been dispatched yet. Contact us immediately at{" "}
        <a
          href="https://wa.me/8801XXXXXXXXX"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          WhatsApp
        </a>{" "}
        or through our contact form. Once dispatched, cancellation is not
        possible.
      </p>
    ),
  },
  {
    category: "orders",
    question: "Do you offer Cash on Delivery (COD)?",
    answer: (
      <p>
        Yes, COD is available in most districts of Bangladesh. However, in some
        remote areas, we may require a partial advance payment. The COD option
        will be shown at checkout if your address is eligible.
      </p>
    ),
  },

  /* ---- Shipping & Delivery ---- */
  {
    category: "shipping",
    question: "How long does delivery take?",
    answer: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong className="text-foreground">
            Inside Dhaka &amp; Bogura:
          </strong>{" "}
          2–3 business days
        </li>
        <li>
          <strong className="text-foreground">Rest of Bangladesh:</strong> 3–5
          business days
        </li>
      </ul>
    ),
  },
  {
    category: "shipping",
    question: "How much does delivery cost?",
    answer: (
      <>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-foreground">Inside Dhaka:</strong> ৳60
          </li>
          <li>
            <strong className="text-foreground">Outside Dhaka:</strong> ৳120
          </li>
        </ul>
        <p className="mt-2">
          <strong className="text-foreground">Free delivery</strong> on orders
          above ৳2000 (anywhere in Bangladesh).
        </p>
      </>
    ),
  },
  {
    category: "shipping",
    question: "Can I track my order?",
    answer: (
      <p>
        Yes. Once your order is dispatched, you&apos;ll receive an SMS with your
        tracking number and courier name. You can also track it via the{" "}
        <Link
          href="/track-order"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Track Order
        </Link>{" "}
        page.
      </p>
    ),
  },
  {
    category: "shipping",
    question: "Do you deliver outside Bangladesh?",
    answer: (
      <p>
        Currently, we only deliver within Bangladesh. We&apos;re working on
        international shipping — if you&apos;re outside the country and
        interested, email us at{" "}
        <a
          href="mailto:support@zuhrbd.com"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          support@zuhrbd.com
        </a>{" "}
        and we&apos;ll notify you when it&apos;s available.
      </p>
    ),
  },

  /* ---- Returns & Refunds ---- */
  {
    category: "returns",
    question: "What is your testing vial policy?",
    answer: (
      <p>
        Every attar order includes a small{" "}
        <strong className="text-foreground">testing vial</strong> so you can try
        the fragrance before opening the full bottle. If the scent isn&apos;t
        for you, you can return the{" "}
        <strong className="text-foreground">unopened full bottle</strong> at
        your doorstep — no questions asked.
      </p>
    ),
  },
  {
    category: "returns",
    question: "How do I request a return or refund?",
    answer: (
      <>
        <p>
          Contact us within{" "}
          <strong className="text-foreground">24 hours</strong> of delivery via:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>WhatsApp — fastest response</li>
          <li>Email — support@zuhrbd.com</li>
          <li>Contact form on our site</li>
        </ul>
        <p className="mt-2">
          Please include your order number and photos (for damaged or incorrect
          items).
        </p>
      </>
    ),
  },
  {
    category: "returns",
    question: "How long does a refund take?",
    answer: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong className="text-foreground">bKash / Nagad:</strong> within 24
          hours of approval
        </li>
        <li>
          <strong className="text-foreground">Card payments:</strong> 5–10
          business days (bank dependent)
        </li>
        <li>
          <strong className="text-foreground">COD orders:</strong> refunded via
          bKash/Nagad only
        </li>
      </ul>
    ),
  },
  {
    category: "returns",
    question: "Which items cannot be returned?",
    answer: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Opened attar bottles (except defective)</li>
        <li>Used accessories or desk items</li>
        <li>Gift cards</li>
        <li>Items without original packaging</li>
      </ul>
    ),
  },

  /* ---- Products ---- */
  {
    category: "products",
    question: "Are your attars 100% alcohol-free?",
    answer: (
      <p>
        Yes — every ZUHR attar is{" "}
        <strong className="text-foreground">100% alcohol-free oil-based</strong>
        . We carefully source from trusted suppliers who follow traditional
        distillation methods. No synthetic alcohol, no dilution.
      </p>
    ),
  },
  {
    category: "products",
    question: "How long does an attar last on the skin?",
    answer: (
      <p>
        Our concentrated oil attars typically last{" "}
        <strong className="text-foreground">6–10 hours</strong> on skin and even
        longer on clothing. Longevity depends on your skin type, body
        temperature, and the specific fragrance notes.
      </p>
    ),
  },
  {
    category: "products",
    question: "How should I store my attar?",
    answer: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Keep away from direct sunlight</li>
        <li>Store in a cool, dry place</li>
        <li>Keep the cap tightly closed when not in use</li>
        <li>Avoid temperature fluctuations</li>
      </ul>
    ),
  },
  {
    category: "products",
    question: "Do you offer samples or testers?",
    answer: (
      <p>
        Yes — a small testing vial is included with every full bottle order. We
        also offer a <strong className="text-foreground">Discovery Set</strong>{" "}
        containing 5 mini attars — perfect for finding your signature scent.
        Check our{" "}
        <Link
          href="/products"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          shop
        </Link>{" "}
        for availability.
      </p>
    ),
  },

  /* ---- Account ---- */
  {
    category: "account",
    question: "Do I need an account to place an order?",
    answer: (
      <p>
        No — you can checkout as a guest. However, creating an account lets you
        save addresses, track orders easily, and access exclusive offers.
      </p>
    ),
  },
  {
    category: "account",
    question: "How do I reset my password?",
    answer: (
      <p>
        Go to the{" "}
        <Link
          href="/forgot-password"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Forgot Password
        </Link>{" "}
        page, enter your registered email, and we&apos;ll send you a reset link.
        The link expires in 15 minutes for security.
      </p>
    ),
  },
  {
    category: "account",
    question: "How do I delete my account?",
    answer: (
      <p>
        Email us at{" "}
        <a
          href="mailto:support@zuhrbd.com"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          support@zuhrbd.com
        </a>{" "}
        with the subject &quot;Delete My Account&quot;. We&apos;ll remove all
        your personal data within 7 days, except records we&apos;re legally
        required to keep (order &amp; tax history).
      </p>
    ),
  },
];

/* ============================================================
   PAGE
   ============================================================ */

const FaqPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const scope = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);

  /* ---- Filter FAQs ---- */
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const matchCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const matchSearch = !q || faq.question.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  /* ---- Reset open index when filter changes ---- */
  useEffect(() => {
    setOpenIndex(filteredFaqs.length > 0 ? 0 : null);
  }, [filteredFaqs.length, activeCategory, searchQuery]);

  /* ============ 1. ENTRANCE ANIMATION (runs ONCE) ============ */
  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-anim='header-badge']", {
        y: -12,
        opacity: 0,
        duration: 0.5,
      })
        .from(
          "[data-anim='header-title']",
          { y: 24, opacity: 0, duration: 0.7 },
          "-=0.3",
        )
        .from(
          "[data-anim='header-sub']",
          { y: 16, opacity: 0, duration: 0.5 },
          "-=0.4",
        )
        .from(
          "[data-anim='search']",
          { y: 20, opacity: 0, duration: 0.5 },
          "-=0.3",
        )
        .from(
          "[data-anim='categories'] > *",
          { y: 12, opacity: 0, duration: 0.35, stagger: 0.04 },
          "-=0.3",
        )
        .from(
          "[data-anim='separator']",
          { scaleX: 0, opacity: 0, duration: 0.6, transformOrigin: "left" },
          "-=0.2",
        )
        .from(
          "[data-anim='faq-item']",
          { y: 14, opacity: 0, duration: 0.4, stagger: 0.04 },
          "-=0.3",
        )
        .from(
          "[data-anim='cta']",
          { y: 24, opacity: 0, duration: 0.6 },
          "-=0.2",
        );
    },
    { scope }, // 👈 NO dependencies — runs once on mount
  );

  /* ============ 2. FILTER ANIMATION (skips first render) ============ */
  useGSAP(
    () => {
      // Skip the very first mount — entrance already handled it
      if (!didMountRef.current) {
        didMountRef.current = true;
        return;
      }

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced || !listRef.current) return;

      const items = listRef.current.querySelectorAll("[data-anim='faq-item']");
      if (items.length === 0) return;

      gsap.fromTo(
        items,
        { y: 8, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.out",
          clearProps: "transform,opacity", // ✅ cleans up after
        },
      );
    },
    { dependencies: [activeCategory, searchQuery], scope },
  );

  return (
    <div
      ref={scope}
      className="container mx-auto max-w-4xl px-4 py-10 lg:px-6 lg:py-16"
    >
      {/* ============ HEADER ============ */}
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <span
          data-anim="header-badge"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
        >
          <span className="h-px w-6 bg-primary" aria-hidden="true" />
          Support Center
        </span>

        <h1
          data-anim="header-title"
          className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Frequently Asked <span className="text-primary">Questions</span>
        </h1>

        <p
          data-anim="header-sub"
          className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-muted-foreground"
        >
          Find quick answers about orders, shipping, returns, and everything
          else. Can&apos;t find what you&apos;re looking for? Just reach out.
        </p>
      </header>

      {/* ============ SEARCH ============ */}
      <div data-anim="search" className="mx-auto mb-6 max-w-xl">
        <div className="relative">
          <Search
            size={16}
            strokeWidth={1.9}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search for an answer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label="Search FAQs"
          />
        </div>
      </div>

      {/* ============ CATEGORIES ============ */}
      <div
        data-anim="categories"
        className="mb-10 flex flex-wrap items-center justify-center gap-2"
      >
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCategory(id)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-all ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Icon size={13} strokeWidth={2} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      <div data-anim="separator">
        <Separator className="mb-10" />
      </div>

      {/* ============ FAQ LIST ============ */}
      <div ref={listRef} className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          filteredFaqs.map((faq, i) => (
            <FaqItem
              key={`${faq.category}-${faq.question}`}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))
        )}
      </div>

      {/* ============ CTA ============ */}
      <section
        data-anim="cta"
        className="relative mt-14 overflow-hidden rounded-2xl border border-border bg-card p-8 text-center md:p-12"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
        />

        <div className="relative mx-auto max-w-lg">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MessageCircle
              size={20}
              strokeWidth={1.9}
              className="text-primary"
              aria-hidden="true"
            />
          </span>

          <h3 className="mt-4 font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Still have questions?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
            Our support team is available 24/7. Reach out and we&apos;ll get
            back to you as soon as possible.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="group inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-6 text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99]"
            >
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">
                Contact Support
              </span>
              <ArrowUpRight
                size={14}
                strokeWidth={2.2}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </Link>

            <a
              href="https://wa.me/8801XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

type FaqItemProps = {
  faq: Faq;
  isOpen: boolean;
  onToggle: () => void;
};

const FaqItem = ({ faq, isOpen, onToggle }: FaqItemProps) => {
  return (
    <div
      data-anim="faq-item"
      className={`overflow-hidden rounded-xl border bg-card transition-colors ${
        isOpen ? "border-primary/40" : "border-border hover:border-primary/30"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span
          className={`text-[14px] font-medium leading-snug transition-colors ${
            isOpen ? "text-primary" : "text-foreground"
          }`}
        >
          {faq.question}
        </span>

        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            isOpen
              ? "rotate-180 bg-primary text-primary-foreground"
              : "rotate-0 bg-muted text-muted-foreground"
          }`}
          aria-hidden="true"
        >
          {isOpen ? (
            <Minus size={14} strokeWidth={2.4} />
          ) : (
            <Plus size={14} strokeWidth={2.4} />
          )}
        </span>
      </button>

      {/* ✅ CSS grid trick — smooth height animation, no JS, no stuck */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60 px-5 pb-5 pt-4 text-[13.5px] leading-relaxed text-muted-foreground [&_strong]:font-semibold">
            {faq.answer}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ query }: { query: string }) => (
  <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Search size={20} strokeWidth={1.9} className="text-muted-foreground" />
    </span>

    <h3 className="mt-4 text-[15px] font-semibold text-foreground">
      No results found
    </h3>
    <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
      {query
        ? `We couldn't find any FAQs matching "${query}". Try a different keyword or browse all categories.`
        : "No FAQs available in this category right now."}
    </p>

    <Link
      href="/contact"
      className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <span className="text-[11.5px] font-semibold uppercase tracking-[0.16em]">
        Ask our team
      </span>
      <ArrowUpRight size={13} strokeWidth={2.2} aria-hidden="true" />
    </Link>
  </div>
);

export default FaqPage;
