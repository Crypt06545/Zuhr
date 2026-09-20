import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const HeroBlock = () => (
  <div className="w-full rounded-3xl overflow-hidden bg-[#0F1115] min-h-[320px] sm:min-h-[360px] lg:min-h-[400px] p-6 sm:p-8 lg:p-12 text-white flex flex-col justify-between relative">
    {/* Product graphic */}
    <div className="absolute right-0 bottom-0 w-1/2 sm:w-[45%] h-full hidden md:flex items-center justify-center pointer-events-none">
      <div className="relative w-full h-[85%]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-2xl z-10" />
        <Image
          src="/images/hero/laptop.png"
          alt="Powerful Tech, Endless Possibilities"
          fill
          sizes="(min-width: 1024px) 40vw, 45vw"
          priority
          className="object-contain drop-shadow-2xl"
        />
      </div>
    </div>

    {/* Copy */}
    <div className="z-10 max-w-xl">
      <span className="bg-orange-600 text-[10px] lg:text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
        New Arrival
      </span>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mt-4 lg:mt-5 leading-tight">
        Powerful Tech.
        <br />
        <span className="text-orange-500">Endless Possibilities.</span>
      </h2>
      <p className="text-gray-400 mt-3 lg:mt-4 text-xs sm:text-sm max-w-xs sm:max-w-sm leading-relaxed hidden sm:block">
        Explore next-gen laptops and accessories built for speed, performance
        and style.
      </p>
    </div>

    {/* CTA */}
    <div className="z-10 mt-6 sm:mt-8">
      <Link
        href="/products"
        className="bg-white text-black text-xs lg:text-sm font-bold px-5 lg:px-7 py-2.5 lg:py-3 rounded-xl hover:bg-orange-600 hover:text-white transition-all inline-flex items-center gap-2 group shadow-md"
      >
        <span>Shop Now</span>
        <ArrowRight
          size={16}
          className="group-hover:translate-x-1 transition-transform"
        />
      </Link>
    </div>
  </div>
);

export default HeroBlock;
