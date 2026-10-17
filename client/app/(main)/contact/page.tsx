"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MessageCircle,
  MapPin,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  orderNumber?: string;
  message: string;
};

type Channel = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  note?: string;
};

/* ============================================================
   DATA
   ============================================================ */

const CHANNELS: Channel[] = [
  {
    icon: MessageCircle,
    title: "WhatsApp Support",
    description:
      "Fastest response for urgent order updates or product inquiries.",
    action: { label: "+880 1XXX-XXXXXX", href: "https://wa.me/8801XXXXXXXXX" },
  },
  {
    icon: Mail,
    title: "Email Direct",
    description: "For corporate inquiries, bulk ordering, or general support.",
    action: { label: "support@zuhrbd.com", href: "mailto:support@zuhrbd.com" },
  },
  {
    icon: MapPin,
    title: "Headquarters",
    description: "Bogura, Rajshahi Division, Bangladesh",
    note: "Response Hours: Sat – Thu (10 AM – 8 PM)",
  },
];

const FAQS = [
  {
    q: "How long do deliveries take?",
    a: "2–3 days inside Dhaka & Bogura, 3–5 days across the rest of Bangladesh.",
  },
  {
    q: "Testing bottle policy?",
    a: "Try the testing vial first. If unopened, the full bottle can be returned at your doorstep.",
  },
] as const;

const SUBJECTS = [
  { value: "order", label: "Order Inquiry" },
  { value: "product", label: "Product Consultation" },
  { value: "returns", label: "Returns & Refunds" },
  { value: "wholesale", label: "Wholesale & Business" },
] as const;

/* ============================================================
   PAGE
   ============================================================ */

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const scope = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    mode: "onBlur",
    defaultValues: { subject: "" },
  });

  const messageLength = watch("message")?.length ?? 0;

  const onSubmit = async (data: ContactFormData) => {
    console.log("Contact form submit:", data);
    await new Promise((r) => setTimeout(r, 500));
    setSubmitted(true);
    reset();
  };

  /* ============ GSAP ENTRANCE ANIMATION ============ */
  useGSAP(
    () => {
      // Respect reduced motion preference
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Header animation
      tl.from("[data-anim='header-line']", {
        width: 0,
        duration: 0.7,
        ease: "power2.inOut",
      })
        .from(
          "[data-anim='header-label']",
          { x: -16, opacity: 0, duration: 0.6 },
          "-=0.5",
        )
        .from(
          "[data-anim='header-title']",
          { y: 30, opacity: 0, duration: 0.9 },
          "-=0.4",
        )
        .from(
          "[data-anim='header-sub']",
          { y: 20, opacity: 0, duration: 0.7 },
          "-=0.6",
        )
        // Channels stagger
        .from(
          "[data-anim='channel']",
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
          },
          "-=0.3",
        )
        // FAQ
        .from(
          "[data-anim='faq-heading']",
          { y: 16, opacity: 0, duration: 0.5 },
          "-=0.3",
        )
        .from(
          "[data-anim='faq-item']",
          {
            y: 16,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
          },
          "-=0.3",
        )
        // Form fields stagger
        .from(
          "[data-anim='form-row']",
          {
            y: 24,
            opacity: 0,
            duration: 0.6,
            stagger: 0.12,
          },
          "-=0.6",
        )
        .from(
          "[data-anim='form-submit']",
          { y: 16, opacity: 0, duration: 0.5 },
          "-=0.2",
        );
    },
    { scope },
  );

  /* ============ SUCCESS CARD ANIMATION ============ */
  useGSAP(
    () => {
      if (!submitted) return;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-anim='success-card']", {
        y: 24,
        opacity: 0,
        scale: 0.96,
        duration: 0.7,
      })
        .from(
          "[data-anim='success-icon']",
          {
            scale: 0,
            rotate: -90,
            duration: 0.7,
            ease: "back.out(1.7)",
          },
          "-=0.4",
        )
        .from(
          "[data-anim='success-text']",
          {
            y: 12,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
          },
          "-=0.4",
        )
        .from(
          "[data-anim='success-btn']",
          { y: 10, opacity: 0, duration: 0.4 },
          "-=0.3",
        );
    },
    { dependencies: [submitted], scope },
  );

  return (
    <div
      ref={scope}
      className="mx-auto w-full max-w-6xl px-4 py-14 md:px-8 lg:py-24"
    >
      {/* ============ HEADER ============ */}
      <header className="mb-14 max-w-2xl md:mb-20">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span
            data-anim="header-line"
            className="h-px w-6 bg-primary"
            aria-hidden="true"
          />
          <span data-anim="header-label">Concierge &amp; Support</span>
        </span>

        <h1
          data-anim="header-title"
          className="mt-4 font-heading text-4xl font-light tracking-tight text-foreground sm:text-5xl lg:text-[56px]"
        >
          Get in <span className="text-primary">Touch</span>
        </h1>

        <p
          data-anim="header-sub"
          className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground"
        >
          Have a question about our products, custom orders, or delivery status?
          Reach out directly — our team is here to help.
        </p>
      </header>

      {/* ============ MAIN GRID ============ */}
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
        {/* ============ LEFT: CHANNELS + FAQ ============ */}
        <div className="space-y-12 lg:col-span-5">
          <div className="space-y-7">
            {CHANNELS.map(
              ({ icon: Icon, title, description, action, note }) => (
                <div
                  key={title}
                  data-anim="channel"
                  className="border-b border-border pb-6 last:border-b-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Icon
                        size={15}
                        strokeWidth={1.9}
                        className="text-primary"
                        aria-hidden="true"
                      />
                    </span>
                    <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground">
                      {title}
                    </h3>
                  </div>

                  <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                    {description}
                  </p>

                  {action && (
                    <a
                      href={action.href}
                      target={
                        action.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        action.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="group mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {action.label}
                      <ArrowUpRight
                        size={13}
                        strokeWidth={2.2}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </a>
                  )}

                  {note && (
                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground/80">
                      <Clock size={11} strokeWidth={2} aria-hidden="true" />
                      {note}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>

          {/* FAQ */}
          <div className="pt-2">
            <h4
              data-anim="faq-heading"
              className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              Frequently Asked
            </h4>
            <div className="space-y-5">
              {FAQS.map(({ q, a }) => (
                <div key={q} data-anim="faq-item">
                  <p className="text-[13.5px] font-medium text-foreground">
                    {q}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============ RIGHT: FORM / SUCCESS ============ */}
        <div className="lg:col-span-7">
          {submitted ? (
            <SuccessCard onReset={() => setSubmitted(false)} />
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {/* Name + Email */}
              <div data-anim="form-row" className="grid gap-6 sm:grid-cols-2">
                <Field id="name" label="Your Name" error={errors.name?.message}>
                  <Input
                    id="name"
                    placeholder="e.g. Mehadi Hasan"
                    aria-invalid={!!errors.name}
                    className="h-11 rounded-lg border-border bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                    {...register("name", { required: "Name is required" })}
                  />
                </Field>

                <Field
                  id="email"
                  label="Email Address"
                  error={errors.email?.message}
                >
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                    className="h-11 rounded-lg border-border bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: "Invalid email address",
                      },
                    })}
                  />
                </Field>
              </div>

              {/* Subject + Order # */}
              <div data-anim="form-row" className="grid gap-6 sm:grid-cols-2">
                <Field
                  id="subject"
                  label="Topic"
                  error={errors.subject?.message}
                >
                  <div className="relative">
                    <select
                      id="subject"
                      aria-invalid={!!errors.subject}
                      defaultValue=""
                      className="h-11 w-full appearance-none rounded-lg border border-border bg-background pl-3.5 pr-10 text-[13.5px] text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      {...register("subject", { required: "Select a topic" })}
                    >
                      <option value="" disabled hidden>
                        Select a topic
                      </option>
                      {SUBJECTS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </Field>

                <Field id="orderNumber" label="Order # (Optional)">
                  <Input
                    id="orderNumber"
                    placeholder="ZUHR-10432"
                    className="h-11 rounded-lg border-border bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                    {...register("orderNumber")}
                  />
                </Field>
              </div>

              {/* Message */}
              <div data-anim="form-row">
                <Field
                  id="message"
                  label="Message"
                  error={errors.message?.message}
                  rightMeta={
                    <span className="text-[10.5px] tabular-nums text-muted-foreground">
                      {messageLength}/500
                    </span>
                  }
                >
                  <Textarea
                    id="message"
                    placeholder="How can we assist you today?"
                    rows={5}
                    maxLength={500}
                    aria-invalid={!!errors.message}
                    className="min-h-[140px] resize-none rounded-lg border-border bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                    {...register("message", {
                      required: "Message is required",
                      maxLength: {
                        value: 500,
                        message: "Message must be under 500 characters",
                      },
                    })}
                  />
                </Field>
              </div>

              <div data-anim="form-submit">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="h-12 w-full rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] sm:w-auto sm:px-10"
                >
                  <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  rightMeta?: React.ReactNode;
  children: React.ReactNode;
};

const Field = ({ id, label, error, rightMeta, children }: FieldProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </Label>
      {rightMeta}
    </div>
    {children}
    {error && (
      <p role="alert" className="text-[11.5px] font-medium text-destructive">
        {error}
      </p>
    )}
  </div>
);

const SuccessCard = ({ onReset }: { onReset: () => void }) => (
  <div
    data-anim="success-card"
    className="rounded-2xl border border-border bg-card p-10 text-center lg:p-14"
  >
    <span
      data-anim="success-icon"
      className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
    >
      <CheckCircle2
        size={28}
        strokeWidth={1.8}
        className="text-primary"
        aria-hidden="true"
      />
    </span>

    <h3
      data-anim="success-text"
      className="mt-5 font-heading text-xl font-semibold text-foreground"
    >
      Message Received
    </h3>
    <p
      data-anim="success-text"
      className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground"
    >
      Thank you for reaching out. We aim to respond within 24 hours.
    </p>

    <div data-anim="success-btn">
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        className="mt-7 h-11 rounded-lg border-border px-8 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
      >
        Send Another Message
      </Button>
    </div>
  </div>
);

export default ContactPage;
