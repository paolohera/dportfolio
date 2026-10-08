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

const SITE_URL = "https://pao-lo.vercel.app";
const SITE_NAME = "Paolo Patigdas";

export const metadata: Metadata = {
  title: {
    default: "Paolo Patigdas | Software Developer",
    template: "%s | Paolo Patigdas",
  },
  description:
    "Paolo Patigdas is a software developer who builds modern, reliable web applications and software that ships.",
  keywords:
    "Paolo Patigdas, Paolo Patigdas developer, Paolo Patigdas software developer, Paolo Patigdas portfolio, software developer, web developer, Next.js developer, React developer, TypeScript developer",
  authors: [
    {
      name: "Paolo Patigdas",
    },
  ],
  creator: "Paolo Patigdas",
  publisher: "Paolo Patigdas",
  metadataBase: new URL(SITE_URL),
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
    title: "Paolo Patigdas | Software Developer",
    description:
      "Paolo Patigdas is a software developer who builds modern, reliable web applications and software that ships.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Paolo Patigdas - Software Developer - Builds software that ships.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paolo Patigdas | Software Developer",
    description:
      "Paolo Patigdas is a software developer who builds modern, reliable web applications and software that ships.",
    images: ["/images/og-image.png"],
    siteId: "",
    creator: "",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${inter.variable} ${plexMono.variable} font-body bg-paper text-ink antialiased`}
      >
        {children}

        <script
          dangerouslySetInnerHTML={{
            __html: `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Paolo Patigdas",
    "url": "https://pao-lo.vercel.app",
    "jobTitle": "Software Developer"
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Paolo Patigdas",
    "url": "https://pao-lo.vercel.app",
    "description": "Paolo Patigdas is a software developer who builds modern, reliable web applications and software that ships."
  }
  </script>
            `,
          }}
        />
      </body>
    </html>
  );
}
