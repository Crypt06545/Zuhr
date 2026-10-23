"use client";

import { useFormContext } from "react-hook-form";

import { DISTRICTS } from "@/lib/checkout-config";
import type { CheckoutFormValues } from "@/lib/checkout";

import CheckoutSection from "./CheckoutSection";
import FormField, { controlClass } from "./FormField";

const AddressSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutFormValues>();

  return (
    <CheckoutSection
      step={2}
      title="Delivery address"
      description="Where should we deliver your order?"
    >
      <div className="grid gap-4">
        <FormField
          label="District"
          htmlFor="district"
          required
          error={errors.district?.message}
        >
          <select
            id="district"
            autoComplete="address-level1"
            aria-invalid={!!errors.district}
            className={`${controlClass} h-10`}
            {...register("district", { required: "Select your district" })}
          >
            <option value="">Select district</option>
            {DISTRICTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Full address"
          htmlFor="address"
          required
          error={errors.address?.message}
          hint="(house, road, area, thana)"
        >
          <textarea
            id="address"
            rows={3}
            autoComplete="street-address"
            placeholder="House 12, Road 4, Sector 7, Uttara"
            aria-invalid={!!errors.address}
            className={`${controlClass} resize-y py-2`}
            {...register("address", {
              required: "Enter your delivery address",
              validate: (value) => {
                const length = value.trim().length;

                if (length < 10) return "Write a more complete address";
                if (length > 200) return "Maximum 200 characters";
                return true;
              },
            })}
          />
        </FormField>

        <FormField
          label="Order note"
          htmlFor="note"
          hint="(optional)"
          error={errors.note?.message}
        >
          <textarea
            id="note"
            rows={2}
            placeholder="Anything we should know? e.g. call before delivery"
            aria-invalid={!!errors.note}
            className={`${controlClass} resize-y py-2`}
            {...register("note", {
              maxLength: { value: 300, message: "Maximum 300 characters" },
            })}
          />
        </FormField>
      </div>
    </CheckoutSection>
  );
};

export default AddressSection;
