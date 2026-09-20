"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/FieldError";
import { shake, useAuthEntrance } from "@/hooks/UseAuthAnimation";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useAuthEntrance(container);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    console.log(data);

    // TODO: Connect NestJS "send reset code" API

    const params = new URLSearchParams({ email: data.email, flow: "reset" });
    router.push(`/verify-otp?${params.toString()}`);
  };

  const onInvalid = () =>
    shake(container.current?.querySelectorAll("input[aria-invalid='true']"));

  return (
    <div ref={container} className="w-full max-w-[420px]">
      {/* Heading */}
      <div data-anim="heading" className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#07372C]/10 text-[#07372C]">
          <KeyRound className="h-6 w-6" />
        </div>

        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-foreground">
          Forgot password?
        </h1>

        <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
          Enter the email linked to your account and we&apos;ll send you a
          6-digit code to reset your password.
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
                Sending code...
              </>
            ) : (
              "Send code"
            )}
          </Button>
        </div>
      </form>

      {/* Back */}
      <p data-form-item className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
