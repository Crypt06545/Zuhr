import { Truck, ShieldCheck, Gift, Headset, Award, Tag } from "lucide-react";

const FEATURES = [
  { Icon: Truck, title: "Free Shipping", desc: "On orders over ৳2000" },
  { Icon: ShieldCheck, title: "Secure Payment", desc: "100% secure checkout" },
  { Icon: Gift, title: "Gift Certificates", desc: "৳1500 to ৳2500" },
  { Icon: Headset, title: "24/7 Support", desc: "Dedicated support" },
  { Icon: Award, title: "Trusted Store", desc: "100% verified seller" },
  { Icon: Tag, title: "Exclusive Offers", desc: "Save more every day" },
] as const;

const StoreFeatures = () => {
  return (
    <section className="border-t border-border">
      <div className="container mx-auto px-4 py-8 lg:px-6 lg:py-10">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 lg:gap-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon
                  size={17}
                  strokeWidth={1.9}
                  className="text-primary"
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0">
                <h4 className="text-[13px] font-semibold leading-tight text-foreground lg:text-[13.5px]">
                  {title}
                </h4>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground lg:text-[11.5px]">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoreFeatures;
