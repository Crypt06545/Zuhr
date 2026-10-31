import Link from "next/link";
import {
  ArrowRight,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

const BRAND_NAME = "ZUHR";

const PERKS = [
  { icon: Truck, text: "Fast delivery" },
  { icon: ShieldCheck, text: "100% authentic" },
  { icon: RefreshCcw, text: "Easy returns" },
];

/* ============================================================
   আঁতরের বোতল (নিজের আঁকা SVG, কোনো ছবির ফাইল লাগে না)
   ============================================================ */

const BottleArt = () => (
  <svg
    viewBox="0 0 240 320"
    fill="none"
    aria-hidden="true"
    className="h-full w-full drop-shadow-2xl"
  >
    <defs>
      {/* তরল শুধু বোতলের ভেতরে দেখায় */}
      <clipPath id="zuhr-hero-body">
        <rect x="40" y="96" width="160" height="204" rx="38" />
      </clipPath>
    </defs>

    {/* ঢাকনা */}
    <rect
      x="94"
      y="14"
      width="52"
      height="50"
      rx="10"
      className="fill-primary"
    />
    <rect
      x="94"
      y="14"
      width="52"
      height="16"
      rx="8"
      fill="white"
      fillOpacity="0.25"
    />
    <rect
      x="90"
      y="62"
      width="60"
      height="16"
      rx="5"
      fill="white"
      fillOpacity="0.55"
    />

    {/* গলা */}
    <rect
      x="104"
      y="78"
      width="32"
      height="22"
      fill="white"
      fillOpacity="0.14"
    />

    {/* বোতলের কাচ */}
    <rect
      x="40"
      y="96"
      width="160"
      height="204"
      rx="38"
      fill="white"
      fillOpacity="0.08"
      stroke="white"
      strokeOpacity="0.28"
      strokeWidth="2"
    />

    {/* তরল */}
    <g clipPath="url(#zuhr-hero-body)">
      <path
        d="M40 176 C 80 160, 120 192, 160 174 C 180 166, 192 168, 200 172 V 300 H 40 Z"
        className="fill-primary"
        fillOpacity="0.92"
      />
      <path
        d="M40 176 C 80 160, 120 192, 160 174 C 180 166, 192 168, 200 172 V 190 C 170 184, 130 208, 90 190 C 70 182, 52 184, 40 190 Z"
        fill="white"
        fillOpacity="0.16"
      />
      <rect
        x="40"
        y="250"
        width="160"
        height="50"
        fill="black"
        fillOpacity="0.14"
      />
    </g>

    {/* আলোর ছটা */}
    <path
      d="M62 128 C 54 160, 54 220, 66 262"
      stroke="white"
      strokeOpacity="0.5"
      strokeWidth="6"
      strokeLinecap="round"
    />

    {/* লেবেল */}
    <rect
      x="72"
      y="196"
      width="96"
      height="74"
      rx="12"
      fill="black"
      fillOpacity="0.28"
      stroke="white"
      strokeOpacity="0.3"
    />
    <text
      x="120"
      y="228"
      textAnchor="middle"
      fill="white"
      fontSize="20"
      fontWeight="700"
      letterSpacing="5"
    >
      {BRAND_NAME}
    </text>
    <line
      x1="96"
      y1="238"
      x2="144"
      y2="238"
      stroke="white"
      strokeOpacity="0.4"
    />
    <text
      x="120"
      y="256"
      textAnchor="middle"
      fill="white"
      fillOpacity="0.7"
      fontSize="9"
      letterSpacing="3"
    >
      PURE ATTAR
    </text>

    {/* ঝিলিক */}
    <path
      d="M214 70 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 l12 -4 Z"
      className="fill-primary"
    />
    <path
      d="M24 150 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 Z"
      fill="white"
      fillOpacity="0.6"
    />
  </svg>
);

/* ============================================================
   HERO
   ============================================================ */

const HeroSection = () => {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex h-full min-h-[460px] overflow-hidden rounded-2xl bg-[oklch(0.2046_0_0)] text-white shadow-sm lg:min-h-[480px]"
    >
      {/* ভাসার অ্যানিমেশন (যাদের "reduce motion" চালু, তাদের জন্য বন্ধ) */}
      <style>{`
        @keyframes zuhr-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* পেছনের আলো ও বিন্দু */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative grid w-full items-center gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-4 lg:p-12">
        {/* ---------- লেখা ---------- */}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12px] font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Premium attars · Delivered across Bangladesh
          </span>

          <h1
            id="hero-heading"
            className="mt-5 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-4xl xl:text-5xl"
          >
            Scents that stay with you,{" "}
            <span className="text-primary">long after you leave.</span>
          </h1>

          <p className="mt-4 max-w-md text-[15px] leading-7 text-white/65 sm:text-base">
            Discover pure oud, rose and musk attars, made to last all day. Find
            the one that feels like you.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[14px] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.2046_0_0)]"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Shop now
            </Link>

            <Link
              href="/about"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Our story
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6">
            {PERKS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 text-[13px] text-white/75"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- বোতল ---------- */}
        <div className="relative mx-auto h-60 w-full max-w-[18rem] sm:h-72 lg:h-[22rem] lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl"
          />

          <div className="relative mx-auto h-full w-auto max-w-full motion-safe:animate-[zuhr-float_6s_ease-in-out_infinite]">
            <BottleArt />
          </div>

          <span className="absolute left-0 top-6 hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Alcohol-free
          </span>
          <span className="absolute bottom-6 right-0 hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm sm:inline-flex">
            <ShieldCheck
              className="h-3.5 w-3.5 text-primary"
              aria-hidden="true"
            />
            Long-lasting
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
