"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { GoogleIcon } from "@/components/common/GoogleIcon";
import { FieldError } from "@/components/common/FieldError";
import { PasswordInput } from "@/components/common/PasswordInput";
import { shake, useAuthEntrance } from "@/hooks/UseAuthAnimation";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),

    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z.string().min(1, "Confirm your password"),

    terms: z.boolean().refine((value) => value === true, {
      message: "You must accept the Terms and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useAuthEntrance(container);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    console.log(data);

    // TODO: Connect NestJS register API

    // Next step: confirm the email with a one-time code
    const params = new URLSearchParams({ email: data.email, flow: "register" });
    router.push(`/verify-otp?${params.toString()}`);
  };

  const onInvalid = () =>
    shake(container.current?.querySelectorAll("input[aria-invalid='true']"));

  return (
    <div ref={container} className="w-full max-w-[420px]">
      {/* Heading */}
      <div data-anim="heading" className="mb-8">
        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-foreground">
          Create your account
        </h1>

        <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
          Sign up to get started. It only takes a minute.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
        {/* Full name */}
        <div data-form-item className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full name
          </Label>

          <Input
            id="fullName"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            className="h-11 rounded-lg px-3.5 shadow-none transition-shadow focus-visible:ring-2"
            {...register("fullName")}
          />

          <FieldError message={errors.fullName?.message} />
        </div>

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
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>

          <PasswordInput
            id="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />

          <FieldError message={errors.password?.message} />
        </div>

        {/* Confirm password */}
        <div data-form-item className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </Label>

          <PasswordInput
            id="confirmPassword"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />

          <FieldError message={errors.confirmPassword?.message} />
        </div>

        {/* Terms */}
        <div data-form-item className="space-y-2">
          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input accent-[#07372C]"
              {...register("terms")}
            />

            <Label
              htmlFor="terms"
              className="cursor-pointer text-sm font-normal leading-5 text-muted-foreground"
            >
              <span>
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </Label>
          </div>

          <FieldError message={errors.terms?.message} />
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
                Creating account...
              </>
            ) : (
              "Create account"
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
          <GoogleIcon className="mr-2.5 h-[18px] w-[18px]" />
          Continue with Google
        </Button>
      </div>

      {/* Login */}
      <p
        data-form-item
        className="mt-8 text-center text-sm text-muted-foreground"
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#07372C] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
