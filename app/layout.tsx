
import type { Metadata } from "next";
import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["500", "700", "900"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

const SITE_URL = "https://paolopatigdas.vercel.app";
const SITE_NAME = "Paolo Patigdas";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Paolo Patigdas",
  url: SITE_URL,
  jobTitle: "IT Specialist and Web Developer",
  description:
    "IT professional working across technical support, computer troubleshooting, system administration, and web application development.",
  mainEntityOfPage: SITE_URL,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "The professional portfolio of Paolo Patigdas, featuring IT support, technical troubleshooting, web development, and technology projects.",
  inLanguage: "en",
  publisher: {
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

    verification: {
    google: "BURZozWb4_t9ekcZng6AEfuHdnwurRkSvJoxwX8X78k",
  },
    
  title: {
    default: "Paolo Patigdas | IT Specialist & Web Developer",
    template: "%s | Paolo Patigdas",
  },

  description:
    "Explore the portfolio of Paolo Patigdas, an IT professional specializing in technical support, computer troubleshooting, system administration, and web development.",

  applicationName: SITE_NAME,

  keywords: [
    "Paolo Patigdas",
    "Paolo Patigdas portfolio",
    "Paolo Patigdas IT",
    "Paolo Patigdas web developer",
    "IT specialist",
    "IT support and troubleshooting",
    "computer troubleshooting",
    "system administration",
    "web development",
    "Next.js developer",
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      { url: "/icons/pp-logo-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/pp-logo-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/pp-logo-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/icons/pp-logo-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/favicon.ico",
    other: [
      {
        rel: "icon",
        type: "image/svg+xml",
        url: "/icons/pp-logo.svg",
        sizes: "any",
      },
    ],
  },

  manifest: "/site.webmanifest",

  openGraph: {
    type: "website",
    title: "Paolo Patigdas | IT Specialist & Web Developer",
    description:
      "Discover Paolo Patigdas's work in IT specialist, technical troubleshooting, system administration, and web development.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_PH",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Paolo Patigdas — IT Specialist and Web Developer",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Paolo Patigdas | IT Specialist & Web Developer",
    description:
      "IT specialist, troubleshooting, system administration, and web development by Paolo Patigdas.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-PH">
      <body
        className={`${archivo.variable} ${inter.variable} ${plexMono.variable} font-body bg-paper text-ink antialiased`}
      >
        {children}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
