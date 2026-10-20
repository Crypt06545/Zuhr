"use client";

import { useState } from "react";
import Marquee from "@/components/common/Marquee";
import UtilityBar from "@/components/common/navbar/Utilitybar";
import Navbar from "@/components/common/navbar/Navbar";

import MobileBottomNav from "@/components/common/navbar/MobileBottomNav";
import MobileDrawer from "@/components/common/MobileDrawer";
import Footer from "@/components/common/footer/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Marquee />
      <UtilityBar />

      {/* ✅ Navbar-এ ড্রয়ার ওপেন করার ফাংশন পাঠাচ্ছি */}
      <Navbar onMenuClick={() => setDrawerOpen(true)} />

      {/* ✅ মোবাইল ড্রয়ার */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1">{children}</main>

      <Footer />
      <MobileBottomNav />
    </>
  );
}
