"use client";

import { useFormContext } from "react-hook-form";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCheckoutTotals } from "@/hooks/useCheckoutTotals";
import { formatPrice } from "@/lib/api/Products.api";
import type { CheckoutFormValues } from "@/lib/checkout";

// ফোন ও ডেস্কটপ দুই জায়গার বাটন একই: তাই একটাই কম্পোনেন্ট
const ConfirmButton = () => {
  const {
    formState: { isSubmitting },
  } = useFormContext<CheckoutFormValues>();
  const { total, shipping } = useCheckoutTotals();

  const feeKnown = shipping !== null;

  return (
    <div className="space-y-3">
      <Button
        type="submit"
        disabled={isSubmitting || !feeKnown}
        className="h-12 w-full gap-2 text-[15px] font-bold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Placing order...
          </>
        ) : feeKnown ? (
          <>Confirm order · {formatPrice(total)}</>
        ) : (
          "Loading delivery charge..."
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden="true" />
        Prices and stock are re-checked when you confirm.
      </p>
    </div>
  );
};

export default ConfirmButton;
