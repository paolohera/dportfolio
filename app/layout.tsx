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

export const metadata: Metadata = {
  title: "Paolo",
  description: "A developer portfolio, built in the open.",
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
      </body>
    </html>
  );
}
