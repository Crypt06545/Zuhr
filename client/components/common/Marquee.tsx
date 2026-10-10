const Marquee = ({ brandName = "ZUHR" }) => {
  const MARQUEE_MESSAGES = [
    `${brandName} অনলাইন শপে আপনাকে স্বাগতম`,
    "অনলাইনে আস্থা ও বিশ্বস্ততার সাথে সারা বাংলাদেশে হোম ডেলিভারি দিয়ে থাকি",
    "অর্ডার কনফার্ম করতে অগ্রিম ডেলিভারি চার্জ পরিশোধ করতে হবে",
    // "অ্যাডভান্স বিকাশ পেমেন্টে পাচ্ছেন ৫% বিশেষ ছাড়",
    "৩-৫ দিনের মধ্যে সারাদেশে হোম ডেলিভারি নিশ্চিত করা হয়",
  ];

  const items = [...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES];

  return (
    <div className="w-full bg-linear-to-r from-neutral-900 via-black to-neutral-900 text-white overflow-hidden py-3 sm:py-3.5 select-none border-y border-white/10">
      <div className="flex items-center whitespace-nowrap animate-marquee">
        {items.map((msg, idx) => (
          <span
            key={idx}
            className="flex items-center text-sm sm:text-base font-medium tracking-wide px-5 sm:px-8"
          >
            {msg}
            <span className="mx-5 sm:mx-8 text-white/30 text-lg">|</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          width: max-content;
          animation: marquee-scroll 38s linear infinite;
          will-change: transform;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @media (max-width: 640px) {
          .animate-marquee {
            animation-duration: 24s;
          }
        }
      `}</style>
    </div>
  );
};

export default Marquee;
