"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/hooks/use-auth";

import { useAuthStore } from "@/store/auth-store";
import { getProfileApi, updateProfileApi } from "@/lib/api/user.api";

type FormValues = { name: string };

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfileApi,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: { name: "" } });

  // ডাটা এলে ফর্মে বসাই
  useEffect(() => {
    if (profile) reset({ name: profile.name });
  }, [profile, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      updateProfileApi({ name: values.name.trim() }),
    onSuccess: (_res, values) => {
      const name = values.name.trim();

      toast.success("Profile updated.");
      reset({ name });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      // Navbar-এ নাম সঙ্গে সঙ্গে বদলায়
      useAuthStore.setState((s) =>
        s.user ? { user: { ...s.user, name } } : s,
      );
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to update profile.")),
  });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted/40" />;
  }

  if (isError || !profile) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>We could not load your profile.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <section className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update the details shown on your account.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => save.mutate(values))}
        noValidate
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "At least 2 characters" },
              maxLength: { value: 50, message: "Maximum 50 characters" },
              validate: (v) => v.trim().length >= 2 || "At least 2 characters",
            })}
          />
          {errors.name?.message && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled readOnly />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed here.
          </p>
        </div>

        <Button type="submit" disabled={!isDirty || save.isPending}>
          {save.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </section>
  );
}
