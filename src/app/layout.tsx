import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zimbabwe Volleyball Association",
    template: "%s | ZVA",
  },
  description:
    "Official platform of the Zimbabwe Volleyball Association — live scores, standings, teams, players, and news from Zimbabwe volleyball.",
  keywords: ["Zimbabwe volleyball", "ZVA", "volleyball Zimbabwe", "live scores", "Premier League volleyball"],
  authors: [{ name: "Zimbabwe Volleyball Association" }],
  creator: "ZVA",
  openGraph: {
    type: "website",
    locale: "en_ZW",
    url: "https://zva.co.zw",
    siteName: "Zimbabwe Volleyball Association",
    title: "Zimbabwe Volleyball Association",
    description: "Live scores, standings, teams & players — Zimbabwe volleyball.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Zimbabwe Volleyball Association", description: "Live scores & news from ZVA." },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#006400",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        {!isAdmin && <Footer />}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
