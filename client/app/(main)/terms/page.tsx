"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FileText, ShieldCheck, Clock, Scale, AlertCircle } from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

/* ============================================================
   DATA — Terms Sections
   ============================================================ */

const sections: Section[] = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance of Terms",
    body: (
      <>
        <p>
          Welcome to ZUHR. By accessing or using{" "}
          <strong className="text-foreground">zuhrbd.com</strong>, placing an
          order, or interacting with any of our services, you agree to be bound
          by these Terms &amp; Conditions and our{" "}
          <Link
            href="/privacy"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-3">
          If you do not agree with any part of these terms, please do not use
          our website or services. We recommend reading this page carefully
          before making a purchase.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          You must be at least{" "}
          <strong className="text-foreground">18 years old</strong> to place an
          order on ZUHR.
        </li>
        <li>
          If you are under 18, you may only use our services under the
          supervision of a parent or legal guardian.
        </li>
        <li>
          By placing an order, you confirm that all information you provide is
          accurate, current, and complete.
        </li>
        <li>
          We reserve the right to refuse service or cancel orders if we believe
          the information provided is false or misleading.
        </li>
      </ul>
    ),
  },
  {
    id: "products-pricing",
    title: "Products & Pricing",
    body: (
      <>
        <p>
          All products listed on ZUHR are subject to availability. We make every
          effort to describe our attars and accessories accurately, but we do
          not warrant that product descriptions, images, or colors are
          completely error-free.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            Prices are listed in{" "}
            <strong className="text-foreground">Bangladeshi Taka (৳)</strong>{" "}
            and include applicable taxes unless stated otherwise.
          </li>
          <li>
            We reserve the right to change prices at any time without prior
            notice. Changes will not affect orders already placed.
          </li>
          <li>
            In the rare event of a pricing error, we will contact you before
            processing the order and offer a full refund or the corrected price.
          </li>
          <li>
            Product images are for illustration purposes. Slight variations in
            packaging or appearance may occur between batches.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "orders-payment",
    title: "Orders & Payment",
    body: (
      <>
        <p>
          When you place an order with ZUHR, you will receive an order
          confirmation via SMS or email. This confirmation does not guarantee
          acceptance — it is an acknowledgement that we have received your
          request.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            We accept{" "}
            <strong className="text-foreground">
              bKash, Nagad, card payments, and cash on delivery
            </strong>{" "}
            (COD may be limited to selected areas).
          </li>
          <li>
            Orders are only confirmed and dispatched once payment is verified
            (except COD orders).
          </li>
          <li>
            We reserve the right to cancel any order at our discretion,
            including suspected fraud or policy violations. You will receive a
            full refund in such cases.
          </li>
          <li>
            All transactions are processed through secure third-party payment
            gateways. ZUHR does not store your full card details or PIN.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "shipping-delivery",
    title: "Shipping & Delivery",
    body: (
      <>
        <p>
          We deliver across Bangladesh through our trusted courier partners.
          Estimated delivery times are:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
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
        <p className="mt-3">
          Delivery times are estimates only and may vary due to weather, courier
          delays, national holidays, or other events beyond our control. ZUHR is
          not liable for delays caused by third-party couriers or circumstances
          outside our reasonable control.
        </p>
      </>
    ),
  },
  {
    id: "returns-refunds",
    title: "Returns & Refunds",
    body: (
      <>
        <p>
          We want you to be completely satisfied with your purchase. Our return
          policy is designed to be fair and straightforward:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-foreground">Testing policy:</strong> We
            offer a small testing vial with each attar. If the scent is not to
            your liking, you may return the{" "}
            <strong className="text-foreground">unopened full bottle</strong> at
            your doorstep.
          </li>
          <li>
            <strong className="text-foreground">
              Damaged or incorrect items:
            </strong>{" "}
            Report within 24 hours of delivery with photos. We will arrange a
            replacement or full refund.
          </li>
          <li>
            <strong className="text-foreground">Refund timeline:</strong>{" "}
            Approved refunds are processed within 5–7 business days to your
            original payment method or as a store credit.
          </li>
          <li>
            <strong className="text-foreground">Non-returnable items:</strong>{" "}
            Opened attar bottles, used accessories, and gift cards cannot be
            returned unless defective.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "account-responsibility",
    title: "Account & User Responsibility",
    body: (
      <>
        <p>
          If you create an account on ZUHR, you are responsible for maintaining
          the confidentiality of your login credentials and for all activity
          under your account.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Do not share your password with anyone.</li>
          <li>Notify us immediately if you suspect unauthorized access.</li>
          <li>
            You agree not to use our website for any unlawful purpose or to
            violate any applicable laws of Bangladesh.
          </li>
          <li>
            We reserve the right to suspend or terminate accounts that violate
            these terms or engage in fraudulent activity.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    body: (
      <>
        <p>
          All content on ZUHR — including text, product descriptions, images,
          logos, and design elements — is the property of ZUHR or its content
          suppliers and is protected by applicable copyright and trademark laws.
        </p>
        <p className="mt-3">
          You may not copy, reproduce, distribute, or use any content from this
          site for commercial purposes without our prior written permission.
        </p>
      </>
    ),
  },
  {
    id: "limitation-liability",
    title: "Limitation of Liability",
    body: (
      <p>
        ZUHR strives to provide accurate information and reliable service, but
        we do not guarantee that our website will be error-free, uninterrupted,
        or free of viruses. To the maximum extent permitted by law, ZUHR shall
        not be liable for any indirect, incidental, or consequential damages
        arising from your use of our website or products, including but not
        limited to loss of data, profits, or business opportunities.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    body: (
      <p>
        These Terms &amp; Conditions shall be governed by and construed in
        accordance with the laws of the{" "}
        <strong className="text-foreground">
          People&apos;s Republic of Bangladesh
        </strong>
        . Any disputes arising from these terms shall be subject to the
        exclusive jurisdiction of the courts of Bogura, Bangladesh.
      </p>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to These Terms",
    body: (
      <p>
        We may update these Terms &amp; Conditions from time to time to reflect
        changes in our practices, legal requirements, or services. The
        &quot;Last updated&quot; date at the top of this page will always
        reflect the most recent revision. Continued use of ZUHR after changes
        means you accept the updated terms.
      </p>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    body: (
      <p>
        For any questions about these Terms &amp; Conditions, please reach us at{" "}
        <a
          href="mailto:legal@zuhrbd.com"
          className="font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
        >
          legal@zuhrbd.com
        </a>{" "}
        or via our{" "}
        <Link
          href="/contact"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          contact form
        </Link>
        . We&apos;ll respond within 48 hours.
      </p>
    ),
  },
];

/* ============================================================
   PAGE
   ============================================================ */

const TermsPage = () => {
  const [activeId, setActiveId] = useState(sections[0].id);
  const scope = useRef<HTMLDivElement>(null);

  /* ============ SCROLL SPY ============ */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        rootMargin: "-100px 0px -60% 0px",
        threshold: 0,
      },
    );

    document
      .querySelectorAll("[data-section]")
      .forEach((n) => observer.observe(n));

    return () => observer.disconnect();
  }, []);

  /* ============ SMOOTH SCROLL ============ */
  const handleTocClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveId(id);
  };

  /* ============ GSAP ENTRANCE ============ */
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
          { y: 24, opacity: 0, duration: 0.8 },
          "-=0.3",
        )
        .from(
          "[data-anim='header-meta']",
          { y: 16, opacity: 0, duration: 0.6 },
          "-=0.5",
        )
        .from(
          "[data-anim='separator']",
          { scaleX: 0, opacity: 0, duration: 0.7, transformOrigin: "left" },
          "-=0.3",
        )
        .from(
          "[data-anim='intro']",
          { y: 20, opacity: 0, duration: 0.6 },
          "-=0.4",
        )
        .from(
          "[data-anim='toc']",
          { x: -24, opacity: 0, duration: 0.7 },
          "-=0.4",
        )
        .from(
          "[data-anim='section']",
          {
            y: 24,
            opacity: 0,
            duration: 0.6,
            stagger: 0.06,
          },
          "-=0.5",
        )
        .from(
          "[data-anim='notice']",
          { y: 24, opacity: 0, duration: 0.7 },
          "-=0.3",
        );
    },
    { scope },
  );

  return (
    <div ref={scope} className="container mx-auto px-4 py-10 lg:px-6 lg:py-16">
      {/* ============ HEADER ============ */}
      <div className="mb-10 max-w-3xl">
        <span
          data-anim="header-badge"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
        >
          <span className="h-px w-6 bg-primary" aria-hidden="true" />
          Legal
        </span>

        <h1
          data-anim="header-title"
          className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl"
        >
          Terms &amp; <span className="text-primary">Conditions</span>
        </h1>

        <div
          data-anim="header-meta"
          className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} strokeWidth={1.9} aria-hidden="true" />
            Last updated: July 24, 2026
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Scale
              size={13}
              strokeWidth={1.9}
              className="text-primary"
              aria-hidden="true"
            />
            Governed by Bangladesh law
          </span>
        </div>
      </div>

      <div data-anim="separator">
        <Separator className="mb-12" />
      </div>

      {/* ============ TOC + CONTENT ============ */}
      <div className="grid gap-12 md:grid-cols-[220px_1fr] lg:gap-16">
        {/* ============ TOC ============ */}
        <nav
          data-anim="toc"
          aria-label="Table of contents"
          className="hidden md:sticky md:top-24 md:block md:self-start"
        >
          <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <FileText size={12} strokeWidth={2} aria-hidden="true" />
            On this page
          </p>

          <ul className="space-y-2 text-[13px]">
            {sections.map((s, i) => {
              const isActive = activeId === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => handleTocClick(e, s.id)}
                    className={`group relative block leading-snug transition-colors ${
                      isActive
                        ? "font-medium text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-300 ${
                        isActive
                          ? "scale-y-100 opacity-100"
                          : "scale-y-0 opacity-0"
                      }`}
                    />

                    <span className="mr-1.5 text-[10.5px] tabular-nums text-muted-foreground/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ============ CONTENT ============ */}
        <div className="space-y-10">
          {/* Intro */}
          <p
            data-anim="intro"
            className="border-b border-border pb-8 text-[14px] leading-relaxed text-muted-foreground"
          >
            These Terms &amp; Conditions outline the rules and regulations for
            using ZUHR and purchasing our products. By accessing this website
            and placing an order, you accept these terms in full. Please read
            them carefully before proceeding.
          </p>

          {/* Sections */}
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              data-section
              data-anim="section"
              className="scroll-mt-24"
            >
              <p className="mb-1.5 text-[11px] font-semibold tracking-[0.18em] text-primary">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground md:text-xl">
                {s.title}
              </h2>
              <div className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_ul]:my-2">
                {s.body}
              </div>
            </section>
          ))}

          {/* Notice card */}
          <div
            data-anim="notice"
            className="mt-12 rounded-xl border border-border bg-primary/5 p-5 lg:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <AlertCircle
                  size={16}
                  strokeWidth={1.9}
                  className="text-primary"
                  aria-hidden="true"
                />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  Questions about these terms?
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  If anything here is unclear or you need clarification about a
                  specific policy, reach out to us at{" "}
                  <a
                    href="mailto:legal@zuhrbd.com"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    legal@zuhrbd.com
                  </a>
                  . Our team will respond within 48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck
                size={12}
                strokeWidth={2}
                className="text-primary"
                aria-hidden="true"
              />
              Secured &amp; verified
            </span>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            <span>Bangladesh jurisdiction</span>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            <span>Effective from 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
