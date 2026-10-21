"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/hooks/use-auth";
import { changePasswordApi } from "@/lib/api/user.api";
import { useAuthStore } from "@/store/auth-store";
import SectionCard from "./Sectioncard";


type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const PasswordField = ({
  id,
  label,
  error,
  autoComplete,
  registration,
}: {
  id: string;
  label: string;
  error?: string;
  autoComplete: string;
  registration: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="pr-10"
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

const PasswordCard = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const change = useMutation({
    mutationFn: (values: FormValues) =>
      changePasswordApi({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.success("Password changed. Please sign in again.");
      reset();
      // সার্ভার সব সেশন বাতিল করেছে: এই ডিভাইসেও লগআউট
      clearAuth();
      queryClient.clear();
      router.replace("/login");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to change password.")),
  });

  return (
    <form onSubmit={handleSubmit((values) => change.mutate(values))} noValidate>
      <SectionCard
        title="Password"
        description="Changing your password signs you out of every device."
        footer={
          <Button type="submit" disabled={change.isPending}>
            {change.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        }
      >
        <div className="grid max-w-md gap-4">
          <PasswordField
            id="currentPassword"
            label="Current password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            registration={register("currentPassword", {
              required: "Enter your current password",
            })}
          />
          <PasswordField
            id="newPassword"
            label="New password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            registration={register("newPassword", {
              required: "Enter a new password",
              minLength: { value: 8, message: "At least 8 characters" },
              maxLength: { value: 72, message: "Maximum 72 characters" },
              validate: (v) =>
                v !== watch("currentPassword") ||
                "New password must be different from the current one",
            })}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            registration={register("confirmPassword", {
              required: "Confirm your new password",
              validate: (v) =>
                v === watch("newPassword") || "Passwords do not match",
            })}
          />
        </div>
      </SectionCard>
    </form>
  );
};

export default PasswordCard;
