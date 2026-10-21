// lib/api/user.api.ts
import { API } from "@/lib/axios";

export type Profile = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
};

export type SessionInfo = {
  _id: string;
  deviceName?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string;
};

// ব্যাকএন্ড { message, data } দেয়; data না থাকলে পুরো body-ই ধরি
const unwrap = <T>(res: { data: unknown }): T => {
  const body = res.data as { data?: unknown };
  return (body?.data ?? body) as T;
};

export const getProfileApi = async (): Promise<Profile> => {
  const res = await API.get("/auth/me");
  const body = unwrap<Partial<Profile> & { user?: Partial<Profile> }>(res);
  const raw = body.user ?? body;
  const email = raw.email ?? "";

  return {
    ...raw,
    email,
    // ব্যাকএন্ড name না দিলে email-এর অংশ, যাতে UI না ভাঙে
    name: raw.name || email.split("@")[0] || "",
  };
};

export const updateProfileApi = (payload: { name: string }) =>
  API.patch("/users/me", payload).then((res) => res.data);

// multipart: ফাইল "image" ফিল্ডে যায় (categories-এর মতোই)
export const uploadAvatarApi = (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  return API.post("/users/me/avatar", formData).then((res) =>
    unwrap<{ avatarUrl: string }>(res),
  );
};

// সফল হলে ব্যাকএন্ড সব সেশন বাতিল করে: তাই ফ্রন্টএন্ডকে আবার লগইনে পাঠাতে হয়
export const changePasswordApi = (payload: {
  currentPassword: string;
  newPassword: string;
}) => API.post("/auth/change-password", payload).then((res) => res.data);

export const getSessionsApi = (): Promise<SessionInfo[]> =>
  API.get("/auth/sessions").then((res) => unwrap<SessionInfo[]>(res));

export const logoutAllApi = () =>
  API.post("/auth/logout-all").then((res) => res.data);
