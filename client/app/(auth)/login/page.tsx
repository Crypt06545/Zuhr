"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

gsap.registerPlugin(useGSAP);

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Error message that slides open when it appears */
const FieldError = ({ message }: { message?: string }) => {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!message || !ref.current || prefersReducedMotion()) return;

      gsap.fromTo(
        ref.current,
        { opacity: 0, y: -6, height: 0 },
        {
          opacity: 1,
          y: 0,
          height: "auto",
          duration: 0.28,
          ease: "power2.out",
        },
      );
    },
    { dependencies: [message] },
  );

  if (!message) return null;

  return (
    <p
      ref={ref}
      role="alert"
      className="overflow-hidden text-xs font-medium text-destructive"
    >
      {message}
    </p>
  );
};

const LoginPage = () => {
  const container = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /* Page-load sequence */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-anim='heading'] > *", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
      })
        .from(
          "[data-form-item]",
          { y: 24, opacity: 0, duration: 0.55, stagger: 0.08 },
          0.25,
        )
        .from(
          "[data-line]",
          {
            scaleX: 0,
            duration: 0.7,
            ease: "power2.inOut",
            transformOrigin: (i: number) =>
              i === 0 ? "right center" : "left center",
          },
          "-=0.5",
        );
    },
    { scope: container },
  );

  const onSubmit = async (data: LoginFormValues) => {
    console.log(data);

    // TODO: Connect NestJS login API
  };

  /* Shake invalid fields when submitting with errors */
  const onInvalid = () => {
    if (prefersReducedMotion()) return;

    const invalid = container.current?.querySelectorAll(
      "input[aria-invalid='true']",
    );

    if (!invalid?.length) return;

    gsap.to(invalid, {
      keyframes: { x: [-8, 8, -5, 5, 0], easeEach: "power1.inOut" },
      duration: 0.4,
    });
  };

  /* Small pop on the eye icon when toggling */
  const togglePassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    setShowPassword((prev) => !prev);

    if (prefersReducedMotion()) return;

    gsap.fromTo(
      e.currentTarget,
      { scale: 0.7 },
      { scale: 1, duration: 0.35, ease: "back.out(2)" },
    );
  };

  return (
    <div ref={container} className="w-full max-w-[420px]">
      {/* Heading */}
      <div data-anim="heading" className="mb-8">
        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-foreground">
          Welcome back
        </h1>

        <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
          Sign in to your account to continue.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
        {/* Email */}
        <div data-form-item className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>

          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className="h-11 rounded-lg px-3.5 shadow-none transition-shadow focus-visible:ring-2"
            {...register("email")}
          />

          <FieldError message={errors.email?.message} />
        </div>

        {/* Password */}
        <div data-form-item className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="h-11 rounded-lg px-3.5 pr-11 shadow-none transition-shadow focus-visible:ring-2"
              {...register("password")}
            />

            <button
              type="button"
              onClick={togglePassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>

          <FieldError message={errors.password?.message} />
        </div>

        {/* Remember */}
        <div data-form-item className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[#07372C]"
          />

          <Label
            htmlFor="remember"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            Remember me
          </Label>
        </div>

        {/* Submit */}
        <div data-form-item>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg bg-[#07372C] text-sm font-medium text-white shadow-sm transition-all hover:bg-[#062E26] active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div data-form-item className="my-7 flex items-center gap-4">
        <div data-line className="h-px flex-1 bg-border" />

        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Or continue with
        </span>

        <div data-line className="h-px flex-1 bg-border" />
      </div>

      {/* Google */}
      <div data-form-item>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-lg border-border bg-background text-sm font-medium shadow-none transition-colors hover:bg-muted/50"
        >
          {/* Google Logo */}
          <svg
            className="mr-2.5 h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M21.35 12.27c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"
            />

            <path
              fill="#34A853"
              d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.74 9.74 0 0 0 12 21.6Z"
            />

            <path
              fill="#FBBC05"
              d="M6.53 13.68a5.86 5.86 0 0 1 0-3.36V7.79H3.28a9.75 9.75 0 0 0 0 8.42l3.25-2.53Z"
            />

            <path
              fill="#EA4335"
              d="M12 6.29c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.36 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.72 5.39l3.25 2.53C7.3 8.01 9.46 6.29 12 6.29Z"
            />
          </svg>
          Continue with Google
        </Button>
      </div>

      {/* Register */}
      <p
        data-form-item
        className="mt-8 text-center text-sm text-muted-foreground"
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-[#07372C] underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>

      {/* Bottom subtle text */}
      <p
        data-form-item
        className="mt-6 text-center text-[11px] leading-5 text-muted-foreground/70"
      >
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
};

export default LoginPage;
