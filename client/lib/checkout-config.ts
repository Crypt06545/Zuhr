// lib/checkout-config.ts
// Checkout-এর স্থির তথ্য: পেমেন্ট পদ্ধতি, নম্বর, জেলা, যাচাইয়ের নিয়ম।
// ডেলিভারি চার্জ এখানে নেই: সার্ভার ঠিক করে (GET /orders/config)।

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
