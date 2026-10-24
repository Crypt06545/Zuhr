"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Banknote, Check, Copy, Info } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { useCheckoutTotals } from "@/hooks/useCheckoutTotals";
import { formatPrice } from "@/lib/api/Products.api";
import {
  PAYMENT_ACCOUNTS,
  PAYMENT_METHODS,
  PHONE_PATTERN,
  TRANSACTION_ID_PATTERN,
  type PaymentMethod,
} from "@/lib/checkout-config";
import type { CheckoutFormValues } from "@/lib/checkout";

import CheckoutSection from "./CheckoutSection";
import FormField from "./FormField";

/* ============================================================
   পেমেন্ট পদ্ধতির চিহ্ন (নিজের আঁকা, কোনো কোম্পানির লোগো নয়)
   ============================================================ */

const BADGE: Record<PaymentMethod, string> = {
  cod: "bg-emerald-500/10 text-emerald-600",
  bkash: "bg-[#E2136E] text-white",
  nagad: "bg-[#F6921E] text-white",
};

const MethodBadge = ({ method }: { method: PaymentMethod }) => (
  <span
    aria-hidden="true"
    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${BADGE[method]}`}
  >
    {method === "cod" ? (
      <Banknote className="h-5 w-5" />
    ) : method === "bkash" ? (
      "bK"
    ) : (
      "N"
    )}
  </span>
);

/* ============================================================
   bKash / Nagad: কোথায় টাকা পাঠাতে হবে + TrxID
   ============================================================ */

const MobilePayment = ({
  method,
  amount,
}: {
  method: Exclude<PaymentMethod, "cod">;
  amount: number | null; // ডেলিভারি চার্জ সার্ভার থেকে না আসা পর্যন্ত null
}) => {
  const {
    register,
    getValues,
    formState: { errors },
  } = useFormContext<CheckoutFormValues>();

  const [copied, setCopied] = useState(false);
  const account = PAYMENT_ACCOUNTS[method];
  const label = method === "bkash" ? "bKash" : "Nagad";

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(account.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please type the number manually.");
    }
  };

  // শুধু bKash/Nagad বাছা থাকলে বাধ্যতামূলক (COD-তে এই ঘরগুলো দেখানোই হয় না)
  const needsMobilePayment = () => getValues("paymentMethod") !== "cod";

  return (
    <div className="mt-4 space-y-5 rounded-xl border border-border bg-muted/30 p-4">
      <ol className="space-y-3 text-sm">
        <li className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
            1
          </span>
          <div className="min-w-0 flex-1">
            <p>
              Open the {label} app and choose <strong>Send Money</strong> to:
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-background px-3 py-1.5 text-[15px] font-semibold tracking-wide">
                {account.number}
              </code>
              <button
                type="button"
                onClick={copyNumber}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{account.type}</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
            2
          </span>
          <p>
            Send exactly{" "}
            {amount !== null ? (
              <strong className="tabular-nums">{formatPrice(amount)}</strong>
            ) : (
              <>
                <strong>the total shown in your order summary</strong> (select
                your district first)
              </>
            )}
            .
          </p>
        </li>
        <li className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
            3
          </span>
          <p>Enter the number you paid from and the transaction ID below.</p>
        </li>
      </ol>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={`${label} number you paid from`}
          htmlFor="senderNumber"
          required
          error={errors.senderNumber?.message}
        >
          <Input
            id="senderNumber"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="01XXXXXXXXX"
            aria-invalid={!!errors.senderNumber}
            {...register("senderNumber", {
              validate: (value) => {
                if (!needsMobilePayment()) return true;
                if (!value.trim()) return `Enter your ${label} number`;

                return (
                  PHONE_PATTERN.test(value.replace(/[\s-]/g, "")) ||
                  "Enter a valid Bangladeshi mobile number"
                );
              },
            })}
          />
        </FormField>

        <FormField
          label="Transaction ID"
          htmlFor="transactionId"
          required
          error={errors.transactionId?.message}
        >
          <Input
            id="transactionId"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="e.g. 8N7A6D5EFG"
            aria-invalid={!!errors.transactionId}
            className="uppercase placeholder:normal-case"
            {...register("transactionId", {
              validate: (value) => {
                if (!needsMobilePayment()) return true;
                if (!value.trim()) return "Enter the transaction ID";

                return (
                  TRANSACTION_ID_PATTERN.test(value.trim()) ||
                  "8-20 letters or numbers, no spaces"
                );
              },
            })}
          />
        </FormField>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Your order is confirmed after we verify this payment.
      </p>
    </div>
  );
};

/* ============================================================
   ধাপ ৩
   ============================================================ */

const PaymentSection = () => {
  const { register, control } = useFormContext<CheckoutFormValues>();

  const method = useWatch({ control, name: "paymentMethod" });
  const { total, shipping } = useCheckoutTotals();

  return (
    <CheckoutSection
      step={3}
      title="Payment method"
      description="Choose how you would like to pay."
    >
      <fieldset>
        <legend className="sr-only">Payment method</legend>

        <div className="grid gap-3">
          {PAYMENT_METHODS.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40"
            >
              <input
                type="radio"
                value={item.id}
                className="sr-only"
                {...register("paymentMethod")}
              />
              <MethodBadge method={item.id} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">
                  {item.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  method === item.id
                    ? "border-primary"
                    : "border-muted-foreground/40"
                }`}
              >
                {method === item.id && (
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {method !== "cod" && (
        <MobilePayment
          method={method}
          amount={shipping === null ? null : total}
        />
      )}
    </CheckoutSection>
  );
};

export default PaymentSection;
