"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Sparkles, Leaf, Clock, Package } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ============================================================
   DATA
   ============================================================ */

const VALUES = [
  {
    icon: Sparkles,
    title: "100% Alcohol-Free",
    description:
      "Pure oil formulations that wear close to skin without harsh synthetic stings.",
  },
  {
    icon: Leaf,
    title: "Ethical Curation",
    description:
      "We selectively partner with master perfumers and heritage distilleries to bring you authenticated, uncompromised formulations.",
  },
  {
    icon: Clock,
    title: "All-Day Longevity",
    description:
      "Concentrated oils that absorb naturally and release scent gradually over hours.",
  },
  {
    icon: Package,
    title: "Local Delivery",
    description:
      "Dispatched directly from Bangladesh with local courier options and testing bottles.",
  },
] as const;

/* ============================================================
   PAGE
   ============================================================ */

const AboutPage = () => {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced) return;

      /* ============ 1. ENTRANCE (immediate, no scroll) ============ */
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTl
        .from("[data-anim='hero-badge']", {
          y: -14,
          opacity: 0,
          duration: 0.6,
        })
        .from(
          "[data-anim='hero-title']",
          { y: 32, opacity: 0, duration: 0.9 },
          "-=0.3",
        )
        .from(
          "[data-anim='hero-sub']",
          { y: 20, opacity: 0, duration: 0.7 },
          "-=0.6",
        )
        .from(
          "[data-anim='hero-image']",
          { y: 40, opacity: 0, scale: 0.97, duration: 1 },
          "-=0.4",
        );

      /* ============ 2. SCROLL REVEALS (set initial state FIRST) ============ */

      // Set initial hidden state for scroll-revealed elements
      gsap.set(
        [
          "[data-anim='foundation-label']",
          "[data-anim='foundation-text'] > *",
          "[data-anim='values-heading']",
          "[data-anim='value-item']",
          "[data-anim='beyond'] > *",
          "[data-anim='cta']",
        ],
        { opacity: 0, willChange: "transform, opacity" },
      );

      gsap.set("[data-anim='foundation-label']", { x: -20 });
      gsap.set("[data-anim='foundation-text'] > *", { y: 24 });
      gsap.set("[data-anim='values-heading']", { y: 24 });
      gsap.set("[data-anim='value-item']", { y: 32 });
      gsap.set("[data-anim='beyond'] > *", { y: 24 });
      gsap.set("[data-anim='cta']", { y: 32 });

      // Reveal helper
      const reveal = (
        trigger: string,
        targets: string | Element[],
        vars: gsap.TweenVars,
        start = "top 85%",
      ) => {
        ScrollTrigger.create({
          trigger,
          start,
          once: true,
          invalidateOnRefresh: true,
          onEnter: () => gsap.to(targets, { opacity: 1, ...vars }),
        });
      };

      /* Foundation */
      reveal(
        "[data-anim='foundation']",
        "[data-anim='foundation-label']",
        { x: 0, duration: 0.7, ease: "power3.out" },
        "top 82%",
      );

      reveal(
        "[data-anim='foundation']",
        "[data-anim='foundation-text'] > *",
        { y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" },
        "top 78%",
      );

      /* Values */
      reveal(
        "[data-anim='values-heading']",
        "[data-anim='values-heading']",
        { y: 0, duration: 0.7, ease: "power3.out" },
        "top 88%",
      );

      reveal(
        "[data-anim='values-grid']",
        "[data-anim='value-item']",
        { y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
        "top 85%",
      );

      /* Beyond */
      reveal(
        "[data-anim='beyond']",
        "[data-anim='beyond'] > *",
        { y: 0, duration: 0.7, stagger: 0.15, ease: "power3.out" },
        "top 85%",
      );

      /* CTA */
      reveal(
        "[data-anim='cta']",
        "[data-anim='cta']",
        { y: 0, duration: 0.8, ease: "power3.out" },
        "top 88%",
      );

      /* Separators — draw from left */
      gsap.utils
        .toArray<HTMLElement>("[data-anim='separator']")
        .forEach((el) => {
          gsap.set(el, {
            scaleX: 0,
            opacity: 0,
            transformOrigin: "left center",
            willChange: "transform, opacity",
          });
          ScrollTrigger.create({
            trigger: el,
            start: "top 92%",
            once: true,
            invalidateOnRefresh: true,
            onEnter: () =>
              gsap.to(el, {
                scaleX: 1,
                opacity: 1,
                duration: 0.9,
                ease: "power2.inOut",
              }),
          });
        });

      /* Hero image parallax */
      gsap.to("[data-anim='hero-image-inner']", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-anim='hero-image']",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      /* Refresh after everything mounts (fixes stuck offsets) */
      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope },
  );

  return (
    <div ref={scope} className="mx-auto max-w-5xl px-4 py-12 md:px-6 lg:py-20">
      {/* ============ HERO ============ */}
      <section className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
        <span
          data-anim="hero-badge"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground"
        >
          <span className="h-px w-6 bg-primary" aria-hidden="true" />
          About ZUHR
        </span>

        <h1
          data-anim="hero-title"
          className="mt-5 font-heading text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[56px]"
        >
          Rooted in Sunnah.
          <br />
          Trusted for <span className="text-primary">purity</span>.
        </h1>

        <p
          data-anim="hero-sub"
          className="mx-auto mt-6 max-w-2xl text-[15px] font-light leading-relaxed text-muted-foreground md:text-base"
        >
          ZUHR brings alcohol-free, long-lasting oil attars to daily wear in
          Bangladesh. Pure ingredients, honest curation, and timeless fragrance.
        </p>
      </section>

      {/* ============ HERO IMAGE ============ */}
      <section data-anim="hero-image" className="mb-16 md:mb-20">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted shadow-sm md:aspect-[21/9]">
          <div
            data-anim="hero-image-inner"
            className="absolute inset-0 h-[115%] w-full"
          >
            <Image
              src="/images/about/hero-attar.jpg"
              alt="ZUHR attar bottle"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
          />
        </div>
      </section>

      {/* ============ FOUNDATION ============ */}
      <section data-anim="foundation" className="mb-16 md:mb-20">
        <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
          <span
            data-anim="foundation-label"
            className="pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
          >
            Our Foundation
          </span>

          <div
            data-anim="foundation-text"
            className="space-y-5 text-[14px] font-light leading-relaxed text-muted-foreground md:text-[15px]"
          >
            <p className="text-base font-normal text-foreground md:text-[17px]">
              Attar is more than fragrance — it is a timeless tradition and an
              honored Sunnah. Yet finding pure, alcohol-free oil that lasts
              throughout the day without heavy markups was surprisingly
              difficult.
            </p>
            <p>
              We created ZUHR to bridge that gap. As a dedicated reseller, we
              carefully source oil-based attars directly from trusted suppliers
              and artisans, delivering authentic quality straight to your door
              across Bangladesh.
            </p>
            <p>
              We don&apos;t manufacture or dilute what we sell. Every bottle is
              chosen for its longevity, richness, and 100% alcohol-free
              formulation — staying true to skin and tradition.
            </p>
          </div>
        </div>
      </section>

      <div data-anim="separator">
        <Separator className="mb-16 md:mb-20" />
      </div>

      {/* ============ CORE VALUES ============ */}
      <section className="mb-16 md:mb-20">
        <div data-anim="values-heading" className="mb-12">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            What Defines Us
          </span>
          <h2 className="mt-3 font-heading text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            Purity in every <span className="text-primary">detail</span>
          </h2>
        </div>

        <div
          data-anim="values-grid"
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              data-anim="value-item"
              className="group rounded-xl border border-border bg-card p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon
                  size={17}
                  strokeWidth={1.9}
                  className="text-primary"
                  aria-hidden="true"
                />
              </span>

              <h3 className="mt-4 text-[14px] font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div data-anim="separator">
        <Separator className="mb-16 md:mb-20" />
      </div>

      {/* ============ BEYOND ATTRARS ============ */}
      {/* <section data-anim="beyond" className="mb-16 md:mb-20">
        <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
          <span className="pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Beyond Fragrance
          </span>
          <div className="max-w-2xl text-[14px] font-light leading-relaxed text-muted-foreground md:text-[15px]">
            <p>
              Alongside our core collection of attars, we offer curated everyday
              essentials — desk pads, cables, and workplace accessories. Just
              like our fragrances, these items are sourced from trusted
              suppliers to bring utility and minimal aesthetic to your daily
              setup.
            </p>
          </div>
        </div>
      </section> */}

      {/* ============ CTA BANNER ============ */}
      <section
        data-anim="cta"
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <h3 className="font-heading text-2xl font-medium tracking-tight text-foreground md:text-[28px]">
              Explore the Fragrance Collection
            </h3>
            <p className="text-[13.5px] font-light text-muted-foreground">
              Rose, Oud, Amber, and Musk oil concentrates.
            </p>
          </div>

          <Link
            href="/products"
            className="group inline-flex h-12 items-center gap-1.5 rounded-lg bg-primary px-8 text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99]"
          >
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">
              Shop Attars
            </span>
            <ArrowUpRight
              size={15}
              strokeWidth={2.2}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
