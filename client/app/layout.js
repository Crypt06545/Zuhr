// app/layout.jsx
import Script from "next/script";
import {
  Inter,
  Baloo_Da_2,
  Hind_Siliguri,
  Noto_Sans_Bengali,
  Anek_Bangla,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const balooDa2 = Baloo_Da_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-baloo-da-2",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});

const anekBangla = Anek_Bangla({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-anek-bangla",
  display: "swap",
});

// SEO & Metadata
export const metadata = {
  metadataBase: new URL("https://www.zuhrbd.com"),
  title: {
    default: "ZUHR | Luxury Oil Perfumes & Attars from Bangladesh",
    template: "%s | ZUHR",
  },
  description:
    "ZUHR brings you premium, alcohol-free oil perfumes (attars) crafted for lasting fragrance. Shop long-lasting luxury attars online in Bangladesh with home delivery.",
  keywords: [
    "zuhr",
    "attar bangladesh",
    "luxury oil perfume",
    "alcohol free perfume",
    "attar online bd",
    "perfume oil bangladesh",
    "best attar bd",
  ],
  authors: [{ name: "ZUHR" }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.zuhrbd.com/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "ZUHR",
    title: "ZUHR | Luxury Oil Perfumes & Attars from Bangladesh",
    description:
      "Premium, alcohol-free oil perfumes crafted for lasting fragrance. Shop ZUHR's luxury attar collection online in Bangladesh.",
    url: "https://www.zuhrbd.com/",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZUHR - Luxury Oil Perfumes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZUHR | Luxury Oil Perfumes & Attars from Bangladesh",
    description:
      "Premium, alcohol-free oil perfumes crafted for lasting fragrance. Shop ZUHR's luxury attar collection online.",
    images: ["/og-image.jpg"],
  },
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ZUHR",
    url: "https://www.zuhrbd.com/",
    logo: "https://www.zuhrbd.com/logo.png",
    description:
      "ZUHR is a Bangladeshi luxury oil perfume (attar) brand offering premium, alcohol-free, long-lasting fragrances.",
    sameAs: [
      "https://www.facebook.com/REPLACE_WITH_YOUR_PAGE",
      "https://www.instagram.com/REPLACE_WITH_YOUR_PAGE",
    ],
  };

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${balooDa2.variable} ${hindSiliguri.variable} ${notoSansBengali.variable} ${anekBangla.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
