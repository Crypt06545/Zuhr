"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { PHONE_PATTERN } from "@/lib/checkout-config";
import type { CheckoutFormValues } from "@/lib/checkout";

import CheckoutSection from "./CheckoutSection";
import FormField from "./FormField";

const ContactSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutFormValues>();

  return (
    <CheckoutSection
      step={1}
      title="Contact details"
      description="We will call or message this number about your delivery."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Full name"
          htmlFor="fullName"
          required
          error={errors.fullName?.message}
        >
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="e.g. Mehadi Hasan"
            aria-invalid={!!errors.fullName}
            {...register("fullName", {
              required: "Enter your full name",
              validate: (value) => {
                const length = value.trim().length;

                if (length < 2) return "At least 2 characters";
                if (length > 80) return "Maximum 80 characters";
                return true;
              },
            })}
          />
        </FormField>

        <FormField
          label="Mobile number"
          htmlFor="phone"
          required
          error={errors.phone?.message}
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            aria-invalid={!!errors.phone}
            {...register("phone", {
              required: "Enter your mobile number",
              validate: (value) =>
                PHONE_PATTERN.test(value.replace(/[\s-]/g, "")) ||
                "Enter a valid Bangladeshi mobile number (01XXXXXXXXX)",
            })}
          />
        </FormField>
      </div>
    </CheckoutSection>
  );
};

export default ContactSection;
