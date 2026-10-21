"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/hooks/use-auth";
import { updateProfileApi } from "@/lib/api/user.api";
import { useAuthStore } from "@/store/auth-store";
import { PROFILE_QUERY_KEY, useProfile } from "@/hooks/Useprofile";
import SectionCard from "@/components/common/account/Sectioncard";
import AvatarUploader from "@/components/common/account/AvatarUploader";

type FormValues = { name: string };

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ defaultValues: { name: "" } });

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
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      useAuthStore.setState((s) =>
        s.user ? { user: { ...s.user, name } } : s,
      );
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to update profile.")),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>We could not load your profile.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Your photo and the details shown on your account.
        </p>
      </div>

      <SectionCard
        title="Profile photo"
        description="This is how you appear across the store."
      >
        <AvatarUploader name={profile.name} avatarUrl={profile.avatarUrl} />
      </SectionCard>

      <form onSubmit={handleSubmit((values) => save.mutate(values))} noValidate>
        <SectionCard
          title="Personal details"
          footer={
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
          }
        >
          <div className="grid max-w-md gap-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                {...register("name", {
                  required: "Name is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                  maxLength: { value: 50, message: "Maximum 50 characters" },
                  validate: (v) =>
                    v.trim().length >= 2 || "At least 2 characters",
                })}
              />
              {errors.name?.message && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email</Label>
                {profile.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <BadgeCheck size={14} aria-hidden="true" />
                    Verified
                  </span>
                )}
              </div>
              <Input id="email" value={profile.email} disabled readOnly />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
