"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { prefersReducedMotion } from "@/hooks/UseAuthAnimation";

// এইখানে নিজের brand name আর text বসাও
const BRAND_NAME = "ZUHR";
const HEADLINE = "Shop your favorites, delivered to your door.";
const SUBTEXT = "Sign in to track orders, save favorites and check out faster.";

const POINTS = [
  { icon: Truck, text: "Fast delivery" },
  { icon: ShieldCheck, text: "Secure payment" },
  { icon: RotateCcw, text: "Easy returns" },
  { icon: Package, text: "Track every order" },
];

const BrandMark = () => (
  <div className="flex items-center gap-2.5">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
      {BRAND_NAME.charAt(0)}
    </div>
    <span className="text-lg font-semibold tracking-tight">{BRAND_NAME}</span>
  </div>
);

const BagIllustration = () => (
  <svg
    viewBox="0 0 200 220"
    fill="none"
    aria-hidden="true"
    className="h-full w-full"
  >
    {/* handle */}
    <path
      d="M70 80 V62 a30 30 0 0 1 60 0 V80"
      className="stroke-primary"
      strokeWidth="6"
      strokeLinecap="round"
    />
    {/* body */}
    <path
      d="M30 80 H170 L180 200 a8 8 0 0 1 -8 9 H28 a8 8 0 0 1 -8 -9 Z"
      className="fill-primary"
    />
    {/* shade */}
    <path d="M30 80 H170 L172 100 H28 Z" fill="black" fillOpacity="0.12" />
    {/* handle holes */}
    <circle cx="70" cy="92" r="5" fill="black" fillOpacity="0.35" />
    <circle cx="130" cy="92" r="5" fill="black" fillOpacity="0.35" />
    {/* smile */}
    <path
      d="M78 150 q22 22 44 0"
      stroke="black"
      strokeOpacity="0.45"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
);

const ProductCard = () => (
  <div
    data-card
    aria-hidden="true"
    className="w-40 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur-sm"
  >
    <div className="flex h-24 items-center justify-center rounded-xl bg-white/[0.06]">
      <Package className="h-7 w-7 text-white/30" />
    </div>
    <div className="mt-3 h-2 w-3/4 rounded-full bg-white/20" />
    <div className="mt-2 h-2 w-1/2 rounded-full bg-white/10" />
    <div className="mt-3 flex items-center justify-between">
      <div className="h-5 w-14 rounded-full bg-primary/90" />
      <div className="h-6 w-6 rounded-full bg-white/10 ring-1 ring-white/10" />
    </div>
  </div>
);

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const panel = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-brand]", { y: -16, opacity: 0, duration: 0.6 })
        .from(
          "[data-bag]",
          {
            scale: 0.6,
            y: 30,
            rotate: -8,
            opacity: 0,
            duration: 0.9,
            ease: "back.out(1.6)",
          },
          "-=0.3",
        )
        .from(
          "[data-card]",
          { y: 40, scale: 0.9, opacity: 0, duration: 0.7, stagger: 0.15 },
          "-=0.6",
        )
        .from(
          "[data-text]",
          { y: 24, opacity: 0, duration: 0.6, stagger: 0.1 },
          "-=0.4",
        )
        .from(
          "[data-point]",
          { y: 16, opacity: 0, duration: 0.5, stagger: 0.08 },
          "-=0.3",
        )
        .from("[data-footer]", { opacity: 0, duration: 0.5 }, "-=0.2");

      // Entrance শেষ হলে float শুরু (আগে শুরু করলে from tween এর সাথে conflict করে)
      tl.add(() => {
        gsap.to("[data-bag]", {
          y: -12,
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
        gsap.to("[data-card]", {
          y: (i: number) => (i % 2 === 0 ? -10 : 10),
          duration: 3,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: (i: number) => i * 0.4,
        });
      });

      // Glow দুইটা ধীরে ধীরে drift করবে
      gsap.to("[data-glow]", {
        x: 30,
        y: 20,
        duration: 8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: { each: 2 },
      });
    },
    { scope: panel },
  );

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      {/* Left (desktop only) */}
      <div
        ref={panel}
        className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-[oklch(0.2046_0_0)] p-12 text-white lg:flex xl:p-16"
      >
        {/* Glows */}
        <div
          data-glow
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          data-glow
          className="pointer-events-none absolute -bottom-32 -right-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />

        {/* Top */}

        {/* Middle */}
        <div className="relative">
          {/* Illustration scene */}
          <div className="relative mx-auto mb-12 h-64 w-full max-w-md xl:h-72">
            <div className="absolute left-0 top-4 -rotate-6">
              <ProductCard />
            </div>
            <div className="absolute left-1/2 top-0 h-56 w-52 -translate-x-1/2 drop-shadow-2xl xl:h-64 xl:w-56">
              <div data-bag className="h-full w-full">
                <BagIllustration />
              </div>
            </div>
            <div className="absolute right-0 top-14 rotate-6">
              <ProductCard />
            </div>
          </div>

          <div className="max-w-md">
            <h2
              data-text
              className="text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] xl:text-[40px]"
            >
              {HEADLINE}
            </h2>
            <p data-text className="mt-4 text-[15px] leading-6 text-white/60">
              {SUBTEXT}
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-4">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} data-point className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                    <Icon className="h-[18px] w-[18px] text-primary" />
                  </span>
                  <span className="text-sm text-white/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <p data-footer className="relative text-xs text-white/40">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </p>
      </div>

      {/* Right */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Mobile brand header */}
        <div className="flex items-center px-6 pt-6 sm:px-8 sm:pt-8 lg:hidden">
          <BrandMark />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8 sm:py-12">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
