"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Download, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/hooks/use-auth";
import {
  disable2faApi,
  enable2faApi,
  generate2faApi,
} from "@/lib/api/auth.api";
import { PROFILE_QUERY_KEY, useProfile } from "@/hooks/Useprofile";
import SectionCard from "./Sectioncard";


type Step = "idle" | "setup" | "codes" | "disable";

type Setup = { qrCode: string; secret: string };

const CODE_PATTERN = /^\d{6}$/;

const StatusBadge = ({ enabled }: { enabled: boolean }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
      enabled
        ? "bg-emerald-500/10 text-emerald-600"
        : "bg-muted text-muted-foreground"
    }`}
  >
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 rounded-full ${
        enabled ? "bg-emerald-500" : "bg-muted-foreground/60"
      }`}
    />
    {enabled ? "Enabled" : "Not enabled"}
  </span>
);

const TwoFactorCard = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const enabled = Boolean(profile?.twoFactorEnabled);

  const [step, setStep] = useState<Step>("idle");
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshProfile = () =>
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

  const reset = () => {
    setStep("idle");
    setSetup(null);
    setCode("");
    setPassword("");
    setRecoveryCodes([]);
    setSaved(false);
    setCopied(false);
  };

  const generate = useMutation({
    mutationFn: generate2faApi,
    onSuccess: (res) => {
      setSetup({ qrCode: res.data.qrCode, secret: res.data.secret });
      setStep("setup");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not start 2FA setup.")),
  });

  const enable = useMutation({
    mutationFn: (value: string) => enable2faApi(value),
    onSuccess: (res) => {
      setRecoveryCodes(res.data.recoveryCodes ?? []);
      setCode("");
      setStep("codes");
      refreshProfile();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Invalid code.")),
  });

  const disable = useMutation({
    mutationFn: () => disable2faApi(password, code),
    onSuccess: () => {
      toast.success("Two-factor authentication disabled.");
      reset();
      refreshProfile();
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to disable 2FA.")),
  });

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the codes and copy them manually.");
    }
  };

  const downloadCodes = () => {
    const blob = new Blob([recoveryCodes.join("\n") + "\n"], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const codeField = (
    <div className="space-y-2">
      <Label htmlFor="twoFactorCode">6-digit code</Label>
      <Input
        id="twoFactorCode"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        className="max-w-[10rem] tracking-[0.3em]"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
      />
    </div>
  );

  return (
    <SectionCard
      title="Two-factor authentication"
      description="Add a second step to your sign-in using an authenticator app."
      action={<StatusBadge enabled={enabled} />}
    >
      {/* ───── idle ───── */}
      {step === "idle" && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-sm text-muted-foreground">
            {enabled
              ? "Your account asks for a code from your authenticator app each time you sign in on a new device."
              : "Protect your account even if your password is stolen. You will need an authenticator app such as Google Authenticator or Authy."}
          </p>

          {enabled ? (
            <Button variant="outline" onClick={() => setStep("disable")}>
              Disable
            </Button>
          ) : (
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Enable 2FA
            </Button>
          )}
        </div>
      )}

      {/* ───── setup: QR + code ───── */}
      {step === "setup" && setup && (
        <div className="space-y-5">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open your authenticator app and scan this QR code.</li>
            <li>Enter the 6-digit code the app shows to confirm.</li>
          </ol>

          <div className="flex flex-wrap items-start gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setup.qrCode}
              alt="2FA QR code"
              className="h-40 w-40 rounded-lg border border-border bg-white p-2"
            />
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Cannot scan? Enter this key manually:
                </p>
                <code className="mt-1 block break-all rounded-md bg-muted px-3 py-2 text-xs">
                  {setup.secret}
                </code>
              </div>
              {codeField}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => enable.mutate(code)}
              disabled={!CODE_PATTERN.test(code) || enable.isPending}
            >
              {enable.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify and enable
            </Button>
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ───── recovery codes (একবারই দেখানো হয়) ───── */}
      {step === "codes" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            Save these recovery codes now. Each works once if you lose your
            phone, and they will not be shown again.
          </div>

          <ul className="grid max-w-md grid-cols-2 gap-2 font-mono text-sm">
            {recoveryCodes.map((item) => (
              <li
                key={item}
                className="rounded-md border border-border bg-muted/40 px-3 py-2 text-center"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyCodes}>
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCodes}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            I have saved my recovery codes
          </label>

          <Button disabled={!saved} onClick={reset}>
            Done
          </Button>
        </div>
      )}

      {/* ───── disable: password + code ───── */}
      {step === "disable" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Confirm with your password and a current code from your
            authenticator app.
          </p>

          <div className="space-y-2">
            <Label htmlFor="disablePassword">Password</Label>
            <Input
              id="disablePassword"
              type="password"
              autoComplete="current-password"
              className="max-w-xs"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {codeField}

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => disable.mutate()}
              disabled={
                !password || !CODE_PATTERN.test(code) || disable.isPending
              }
            >
              {disable.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Disable 2FA
            </Button>
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

export default TwoFactorCard;
