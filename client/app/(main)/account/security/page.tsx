"use client";

import PasswordCard from "@/components/common/account/PasswordCard";
import SessionsCard from "@/components/common/account/SessionsCard";
import TwoFactorCard from "@/components/common/account/TwoFactorCard";



export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Keep your account safe: password, two-factor sign-in and devices.
        </p>
      </div>

      <PasswordCard />
      <TwoFactorCard />
      <SessionsCard />
    </div>
  );
}
