// lib/checkout-config.ts

export type PaymentMethod = "cod" | "bkash" | "nagad";

export const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    id: "cod",
    label: "Cash on delivery",
    description: "Pay in cash when your order arrives",
  },
  {
    id: "bkash",
    label: "bKash",
    description: "Send money, then enter the transaction ID",
  },
  {
    id: "nagad",
    label: "Nagad",
    description: "Send money, then enter the transaction ID",
  },
];

// TODO: আসল bKash/Nagad নম্বর বসাও (এখন শুধু নমুনা)
export const PAYMENT_ACCOUNTS: Record<
  Exclude<PaymentMethod, "cod">,
  { number: string; type: string }
> = {
  bkash: { number: "01XXXXXXXXX", type: "Personal · Send Money" },
  nagad: { number: "01XXXXXXXXX", type: "Personal · Send Money" },
};

/* ============================================================
   DELIVERY CHARGE
   বগুড়ার ভেতরে ৳৬০, বাইরে ৳১৩০।
   এটা শুধু দেখানোর জন্য। আসল মোট ব্যাকএন্ড নিজে হিসাব করে (জেলা দেখে),
   তাই ব্যাকএন্ডের সংখ্যার সঙ্গে এখানকার সংখ্যা সবসময় এক রাখতে হবে।
   ============================================================ */

export const SHIPPING = {
  homeDistrict: "Bogura",
  inside: 60,
  outside: 130,
} as const;

// জেলা না বাছা পর্যন্ত চার্জ নেই (null)
export const shippingFeeFor = (district: string): number | null => {
  const value = district.trim().toLowerCase();

  if (!value) return null;

  return value === SHIPPING.homeDistrict.toLowerCase()
    ? SHIPPING.inside
    : SHIPPING.outside;
};

// বাংলাদেশের মোবাইল: 01 + (3-9) + আরও ৮ সংখ্যা, শুরুতে +88 বা 88 থাকতে পারে
export const PHONE_PATTERN = /^(?:\+?88)?01[3-9]\d{8}$/;

// bKash/Nagad-এর TrxID: ইংরেজি অক্ষর ও সংখ্যা, সাধারণত ১০ অক্ষর
export const TRANSACTION_ID_PATTERN = /^[A-Za-z0-9]{8,20}$/;

export const DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokathi",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
] as const;
