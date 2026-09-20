import Image from "next/image";
import Link from "next/link";

const NavBrand = () => (
  <div className="flex items-center shrink-0 h-full">
    <Link href="/" className="flex items-center h-full cursor-pointer">
      <Image
        src="/ZUHR_logo_black.png"
        alt="ZUHR Brand Logo"
        width={180}
        height={80}
        priority
        className="h-16 lg:h-20 w-auto object-contain"
        sizes="(max-width: 1024px) 140px, 180px"
      />
    </Link>
  </div>
);

export default NavBrand;
