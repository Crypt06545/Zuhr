"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useVerifyEmail, getErrorMessage } from "@/hooks/use-auth";
import { toast } from "sonner";

const VerifyEmailContent = () => {
  const params = useSearchParams();
  const token = params.get("token");
  const verifyEmail = useVerifyEmail();
  const hasRun = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Strict Mode এ effect দুইবার চলে, কিন্তু one-time token একবারই use হবে
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    // token URL এ থাকলে history/referrer এ leak হতে পারে, তাই সরিয়ে দিচ্ছি
    window.history.replaceState(null, "", window.location.pathname);

    verifyEmail
      .mutateAsync(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
        toast.success("Email verified successfully.");
      })
      .catch((error) => {
        const msg = getErrorMessage(error, "Verification failed.");
        setStatus("error");
        setMessage(msg);
        toast.error(msg);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="w-full max-w-[420px] text-center">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Verifying your email...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold">Email Verified</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link
            href="/login"
            className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue to sign in
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-semibold">Verification Failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link
            href="/login"
            className="mt-6 flex h-11 w-full items-center justify-center rounded-lg border border-border text-sm font-medium"
          >
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
};

const VerifyEmailPage = () => (
  <Suspense>
    <VerifyEmailContent />
  </Suspense>
);

export default VerifyEmailPage;
