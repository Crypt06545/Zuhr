"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, Loader2, LockKeyhole } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/FieldError";
import { PasswordInput } from "@/components/common/PasswordInput";
import {
  prefersReducedMotion,
  shake,
  useAuthEntrance,
} from "@/hooks/UseAuthAnimation";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "New password is required")
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/* -------------------------------------------------------------------------- */
/*  Success state                                                             */
/* -------------------------------------------------------------------------- */

const ResetSuccess = () => {
  const container = useRef<HTMLDivElement>(null);

  useAuthEntrance(container);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.from("[data-check]", {
        scale: 0,
        rotate: -30,
        duration: 0.6,
        delay: 0.15,
        ease: "back.out(1.8)",
      });
    },
    { scope: container },
  );

  return (
    <div ref={container} className="w-full max-w-[420px]">
      <div data-anim="heading" className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#07372C]">
          <Check data-check className="h-6 w-6 text-white" strokeWidth={3} />
        </div>

        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-foreground">
          Password updated
        </h1>

        <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
          Your password has been changed. Sign in with your new password to
          continue.
        </p>
      </div>

      <div data-form-item>
        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-[#07372C] text-sm font-medium text-white shadow-sm transition-all hover:bg-[#062E26] active:scale-[0.99]"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const ResetPasswordPage = () => {
  const container = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useAuthEntrance(container);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    console.log(data);

    // TODO: Connect NestJS reset-password API (send the reset token from the OTP step)

    setDone(true);
  };

  const onInvalid = () =>
    shake(container.current?.querySelectorAll("input[aria-invalid='true']"));

  if (done) return <ResetSuccess />;

  return (
    <div ref={container} className="w-full max-w-[420px]">
      {/* Heading */}
      <div data-anim="heading" className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#07372C]/10 text-[#07372C]">
          <LockKeyhole className="h-6 w-6" />
        </div>

        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-foreground">
          Set a new password
        </h1>

        <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
        {/* New password */}
        <div data-form-item className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            New password
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
            Confirm new password
          </Label>

          <PasswordInput
            id="confirmPassword"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />

          <FieldError message={errors.confirmPassword?.message} />
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
                Updating password...
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
