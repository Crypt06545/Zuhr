"use client";

import { useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FileText, ShieldCheck, Clock } from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

/* ============================================================
   DATA — Policy Sections
   ============================================================ */

const sections: Section[] = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: (
      <>
        <p>When you browse ZUHR or place an order, we collect:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-foreground">Contact details</strong> — name,
            phone number, email, and delivery address, provided when you check
            out or create an account.
          </li>
          <li>
            <strong className="text-foreground">Order information</strong> —
            products purchased, order value, and payment method (bKash, Nagad,
            card, or cash on delivery).
          </li>
          <li>
            <strong className="text-foreground">Payment data</strong> — for card
            and mobile-banking payments, transactions are processed directly by
            our payment partner. ZUHR does not store your full card number or
            banking PIN on our servers.
          </li>
          <li>
            <strong className="text-foreground">Usage data</strong> — pages
            visited, device type, and approximate location, collected
            automatically through Google Analytics.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How We Use Your Information",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>To process, pack, and deliver your order.</li>
        <li>To contact you about order status, delivery, or issues.</li>
        <li>
          To send you offers or updates, only if you&apos;ve opted in — you can
          unsubscribe at any time.
        </li>
        <li>
          To understand which products and pages perform well, so we can improve
          the site.
        </li>
        <li>To prevent fraud and resolve payment or delivery disputes.</li>
      </ul>
    ),
  },
  {
    id: "cookies-tracking",
    title: "Cookies & Tracking",
    body: (
      <>
        <p>
          ZUHR uses cookies to keep your cart working between pages and to
          understand site traffic through Google Analytics. Cookies do not give
          us access to your device beyond what&apos;s needed for these purposes.
        </p>
        <p className="mt-3">
          You can disable cookies in your browser settings. Some site features,
          like keeping items in your cart, may not work correctly if you do.
        </p>
      </>
    ),
  },
  {
    id: "sharing-your-information",
    title: "Sharing Your Information",
    body: (
      <>
        <p>We do not sell your personal information. We share it only with:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-foreground">Delivery partners</strong> —
            your name, phone number, and address, so your order can reach you.
          </li>
          <li>
            <strong className="text-foreground">Payment processors</strong> — to
            complete mobile-banking or card transactions securely.
          </li>
          <li>
            <strong className="text-foreground">
              Analytics providers (Google Analytics)
            </strong>{" "}
            — anonymized usage data to help us understand site performance.
          </li>
          <li>
            <strong className="text-foreground">Legal authorities</strong> —
            only if required by law or to protect against fraud.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "data-security",
    title: "Data Security",
    body: (
      <p>
        We use industry-standard measures, including encrypted checkout (HTTPS)
        and restricted internal access, to protect your data. No online system
        is 100% risk-free, but we do not store sensitive payment credentials on
        our own servers and limit access to customer data to staff who need it
        to fulfil your order.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your Rights & Choices",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Request a copy of the personal data we hold about you.</li>
        <li>Ask us to correct inaccurate information.</li>
        <li>
          Ask us to delete your account and associated data, subject to records
          we&apos;re legally required to keep (such as order and tax history).
        </li>
        <li>Opt out of marketing emails or SMS at any time.</li>
      </ul>
    ),
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    body: (
      <p>
        ZUHR is intended for users 18 and older. We do not knowingly collect
        personal information from children. If you believe a child has provided
        us with personal data, contact us and we will remove it.
      </p>
    ),
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to This Policy",
    body: (
      <p>
        We may update this policy as our practices or legal requirements change.
        The &quot;Last updated&quot; date below will always reflect the most
        recent revision. Continued use of ZUHR after changes means you accept
        the updated policy.
      </p>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    body: (
      <p>
        For questions about this policy or your data, reach us at{" "}
        <a
          href="mailto:privacy@zuhrbd.com"
          className="font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
        >
          privacy@zuhrbd.com
        </a>{" "}
        or through the contact form on our site.
      </p>
    ),
  },
];

/* ============================================================
   PAGE
   ============================================================ */

const PrivacyPage = () => {
  const [activeId, setActiveId] = useState(sections[0].id);
  const scope = useRef<HTMLDivElement>(null);

  /* ============ SCROLL SPY (active TOC on scroll) ============ */
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

    const nodes = document.querySelectorAll("[data-section]");
    nodes.forEach((n) => observer.observe(n));

    return () => observer.disconnect();
  }, []);

  /* ============ SMOOTH SCROLL (TOC click) ============ */
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
            stagger: 0.08,
          },
          "-=0.5",
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
          Privacy <span className="text-primary">Policy</span>
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
            <ShieldCheck
              size={13}
              strokeWidth={1.9}
              className="text-primary"
              aria-hidden="true"
            />
            Applies to zuhrbd.com
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
                    {/* Active indicator bar */}
                    <span
                      aria-hidden="true"
                      className={`absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all duration-300 ${
                        isActive
                          ? "opacity-100 scale-y-100"
                          : "opacity-0 scale-y-0"
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
            This policy explains what personal information ZUHR collects when
            you shop with us, how we use it, and the choices you have. By using
            zuhrbd.com or placing an order with us, you agree to the practices
            described below.
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

          {/* Bottom note */}
          <div className="mt-12 rounded-xl border border-border bg-primary/5 p-5 lg:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck
                  size={16}
                  strokeWidth={1.9}
                  className="text-primary"
                  aria-hidden="true"
                />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  Your privacy matters
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  If you have any questions about how we handle your data, email
                  us at{" "}
                  <a
                    href="mailto:privacy@zuhrbd.com"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    privacy@zuhrbd.com
                  </a>
                  . We&apos;ll respond within 48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
