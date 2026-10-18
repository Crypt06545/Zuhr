import HeroSection from "@/components/home/HeroSection";
import StoreFeatures from "@/components/common/StoreFeatures";
import MegaMenuSidebar from "@/components/common/MegaMenuSidebar";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-6 lg:px-6">
      {/* Top Section: Sidebar + Hero */}
      <div className="flex gap-6 items-stretch">
        {/* Left Side: Mega Sidebar (Only shows on Desktop) */}
        <MegaMenuSidebar />

        {/* Right Side: Hero Banner */}
        <div className="flex-1 w-full min-w-0">
          <HeroSection />
        </div>
      </div>

      {/* Store Features Below */}
      <div className="mt-8">
        <StoreFeatures />
      </div>
    </div>
  );
}
