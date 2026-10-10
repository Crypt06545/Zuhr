"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/common/FieldError";
import {
  useVerify2faLogin,
  useVerifyRecoveryCode,
  getErrorMessage,
} from "@/hooks/use-auth";
import { toast } from "sonner";

const Verify2faPage = () => {
  const router = useRouter();
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState("");

  const verify2fa = useVerify2faLogin();
  const verifyRecovery = useVerifyRecoveryCode();

  useEffect(() => {
    const token = sessionStorage.getItem("2fa_temp_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setTempToken(token);
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;
    setError("");

    try {
      if (recoveryMode) {
        await verifyRecovery.mutateAsync({
          tempToken,
          recoveryCode: code,
          trustDevice,
        });
      } else {
        await verify2fa.mutateAsync({ tempToken, code, trustDevice });
      }

      sessionStorage.removeItem("2fa_temp_token");
      toast.success("Logged in successfully.");
      router.push("/"); // তোমার actual home/dashboard route
    } catch (err) {
      const message = getErrorMessage(err, "Invalid code. Please try again.");
      setError(message);
      toast.error(message);
    }
  };
  const isSubmitting = verify2fa.isPending || verifyRecovery.isPending;

  if (!tempToken) return null;

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-accent-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-foreground">
          Two-factor verification
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
          {recoveryMode
            ? "Enter one of your recovery codes."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={recoveryMode ? "xxxxxx-xxxxxx" : "123456"}
            maxLength={recoveryMode ? 13 : 6}
            className="h-12 rounded-lg text-center text-lg font-semibold"
            autoFocus
          />
          <FieldError message={error} />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="trustDevice"
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <label
            htmlFor="trustDevice"
            className="text-sm text-muted-foreground"
          >
            Trust this device for 30 days
          </label>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || code.length === 0}
          className="h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setRecoveryMode((prev) => !prev);
          setCode("");
          setError("");
        }}
        className="mt-6 w-full text-center text-sm font-medium text-accent-foreground underline-offset-4 hover:underline"
      >
        {recoveryMode
          ? "Use authenticator code instead"
          : "Use a recovery code instead"}
      </button>
    </div>
  );
};

export default Verify2faPage;
