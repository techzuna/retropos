import type { Metadata } from "next";
import { Figtree, Geist_Mono, Young_Serif } from "next/font/google";
import { getRestaurant } from "@/lib/restaurant";
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

export async function generateMetadata(): Promise<Metadata> {
  try {
    const restaurant = await getRestaurant();
    return {
      title: { default: `${restaurant.name} — book a table`, template: `%s — ${restaurant.name}` },
      description: restaurant.description,
    };
  } catch {
    // Keeps `next build` alive when no database is reachable.
    return { title: "RestroReserve" };
  }
}

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
