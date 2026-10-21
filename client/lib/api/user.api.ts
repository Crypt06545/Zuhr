// lib/api/user.api.ts
import { API } from "@/lib/axios";

export type Profile = { name: string; email: string };

// পড়া: আগে থেকেই থাকা GET /auth/me (এখন name-ও দেয়)
export const getProfileApi = (): Promise<Profile> =>
  API.get("/auth/me").then((res) => {
    const body = res.data?.data ?? res.data;
    return (body?.user ?? body) as Profile;
  });

// লেখা: PATCH /users/me
export const updateProfileApi = (payload: { name: string }) =>
  API.patch("/users/me", payload).then((res) => res.data);
