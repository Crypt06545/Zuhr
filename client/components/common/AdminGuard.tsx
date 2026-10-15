"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getMeApi } from "@/lib/api/auth.api";
import { ensureAccessToken } from "@/lib/axios";

class NotSignedInError extends Error {}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

// /auth/me can answer { data: { user } }, { data: user } or the user itself
const pickUser = (body: unknown) => {
  const root = asRecord(body);
  const data = asRecord(root?.data);
  return asRecord(data?.user) ?? data ?? asRecord(root?.user) ?? root;
};

// TODO: if your user object names the role field differently, add it here.
// Anything that is not clearly "admin" is treated as NOT an admin.
const isAdmin = (user: Record<string, unknown> | null) =>
  !!user &&
  [user.role, user.userType, user.type].some(
    (value) => typeof value === "string" && value.toLowerCase() === "admin",
  );

const Screen = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

// Nothing inside the admin area is rendered (and none of its data requests
// start) until the backend has confirmed that the signed-in user is an admin.
export const AdminGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  // The access token lives only in memory, so after a reload it is gone.
  // Get it first (one refresh call), then ask /auth/me: no request is sent
  // without a token, so there is no 401 at all.
  const { data, error, isPending, isError, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      if (!(await ensureAccessToken())) throw new NotSignedInError();
      return pickUser(await getMeApi());
    },
    retry: false,
    staleTime: 0,
    gcTime: 0, // checked again every time the admin area is opened
    refetchOnWindowFocus: false,
  });

  const notSignedIn = isError && error instanceof NotSignedInError;
  const allowed = !isPending && !isError && isAdmin(data ?? null);
  const denied = !isPending && !isError && !allowed;

  useEffect(() => {
    if (notSignedIn) router.replace("/login");
  }, [notSignedIn, router]);

  useEffect(() => {
    if (!denied) return;
    if (process.env.NODE_ENV === "development") {
      console.warn("[AdminGuard] no admin role found on this user:", data);
    }
    router.replace("/");
  }, [denied, data, router]);

  if (isPending || notSignedIn) {
    return (
      <Screen>
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking access...
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ShieldAlert className="h-5 w-5" />
        <p>We could not verify your access.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          Try again
        </Button>
      </Screen>
    );
  }

  if (!allowed) {
    return (
      <Screen>
        <ShieldAlert className="h-5 w-5" />
        <p>You do not have access to this area. Redirecting...</p>
      </Screen>
    );
  }

  return <>{children}</>;
};
