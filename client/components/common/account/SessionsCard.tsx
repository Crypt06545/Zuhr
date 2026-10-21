"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Laptop, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/hooks/use-auth";
import { getSessionsApi, logoutAllApi } from "@/lib/api/user.api";
import { useAuthStore } from "@/store/auth-store";
import SectionCard from "./Sectioncard";


const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

const SessionsCard = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [confirming, setConfirming] = useState(false);

  const {
    data: sessions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: getSessionsApi,
    retry: false,
  });

  const signOutAll = useMutation({
    mutationFn: logoutAllApi,
    onSuccess: () => {
      toast.success("Signed out of all devices.");
      clearAuth();
      queryClient.clear();
      router.replace("/login");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Failed to sign out.")),
  });

  return (
    <SectionCard
      title="Active sessions"
      description="Devices where your account is currently signed in."
      footer={
        confirming ? (
          <>
            <span className="mr-auto text-sm text-muted-foreground">
              This also signs you out here.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={signOutAll.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => signOutAll.mutate()}
              disabled={signOutAll.isPending}
            >
              {signOutAll.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm sign out
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
            disabled={!sessions?.length}
          >
            Sign out of all devices
          </Button>
        )
      }
    >
      {isLoading && (
        <div className="h-16 animate-pulse rounded-lg bg-muted/40" />
      )}

      {isError && (
        <p className="text-sm text-muted-foreground">
          We could not load your sessions.
        </p>
      )}

      {sessions && sessions.length === 0 && (
        <p className="text-sm text-muted-foreground">No active sessions.</p>
      )}

      {sessions && sessions.length > 0 && (
        <ul className="divide-y divide-border">
          {sessions.map((session) => {
            const mobile = /mobile/i.test(session.deviceName ?? "");
            const Icon = mobile ? Smartphone : Laptop;

            return (
              <li key={session._id} className="flex items-center gap-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {session.deviceName ?? "Unknown device"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[session.ipAddress, formatDate(session.createdAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
};

export default SessionsCard;
