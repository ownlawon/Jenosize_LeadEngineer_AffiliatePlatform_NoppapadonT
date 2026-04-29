import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen antialiased">
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
