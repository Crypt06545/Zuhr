"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useLogout } from "@/hooks/use-auth";
import { ME_QUERY_KEY } from "@/hooks/useCurrentUser";
import { useAuthStore } from "@/store/auth-store";

// Navbar মেনু আর মোবাইল drawer দুই জায়গায় একই লগআউট
export const useSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const logout = useLogout();

  const signOut = (onDone?: () => void) =>
    logout.mutate(undefined, {
      // সার্ভার ব্যর্থ হলেও এই ডিভাইস থেকে লগআউট হবে, ব্যবহারকারী আটকে থাকবে না
      onSettled: () => {
        clearAuth();
        queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
        onDone?.();
        router.replace("/");
        router.refresh();
      },
    });

  return { signOut, isPending: logout.isPending };
};
