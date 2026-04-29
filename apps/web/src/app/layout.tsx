import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Inter for body — high-x-height, generous letterforms, designed for screens.
// Variable axis lets us pull weights at runtime without shipping multiple files.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Mono for short codes, UTM slugs, code samples — JetBrains Mono has clear
// 0/O and 1/l shapes that match our nanoid alphabet rationale.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Jenosize Affiliate · Lazada vs Shopee price comparison",
    template: "%s · Jenosize Affiliate",
  },
  description:
    "Compare Lazada and Shopee prices side by side and generate trackable affiliate short links per campaign — built as a Lead Engineer take-home for Jenosize.",
  keywords: ["affiliate", "Lazada", "Shopee", "price comparison", "Jenosize"],
  authors: [{ name: "Noppapadon T." }],
  openGraph: {
    type: "website",
    title: "Jenosize Affiliate Platform",
    description:
      "Lazada vs Shopee price comparison + affiliate short links + click analytics.",
    siteName: "Jenosize Affiliate",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jenosize Affiliate Platform",
    description:
      "Lazada vs Shopee price comparison + affiliate short links + click analytics.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "border border-slate-200 shadow-md",
            },
          }}
        />
      </body>
    </html>
  );
}
