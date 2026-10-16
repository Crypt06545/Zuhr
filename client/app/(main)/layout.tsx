import Marquee from "@/components/common/Marquee";
import UtilityBar from "@/components/common/navbar/Utilitybar";
import Navbar from "@/components/common/navbar/Navbar";

import MobileBottomNav from "@/components/common/navbar/MobileBottomNav";
import Footer from "@/components/common/footer/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Marquee />
      <UtilityBar />
      <Navbar />

      <main className="flex-1">{children}</main>

      <Footer />
      <MobileBottomNav />
    </>
  );
}
