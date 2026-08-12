import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono, Young_Serif } from "next/font/google";
import "./globals.css";

const displayFont = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-young-serif",
});

const bodyFont = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const monoFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: { default: "RestroReserve POS", template: "%s — RestroReserve" },
  description: "Self-hosted restaurant point of sale.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // POS on a shared tablet: accidental pinch-zoom mid-service is worse than
  // the a11y cost; text sizes are already touch-generous.
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
