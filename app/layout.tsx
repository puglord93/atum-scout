import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATUM Researcher Tool",
  description: "Deep tech researcher and technology scouting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex items-center gap-10 h-14">
              <Link href="/" className="text-lg font-bold tracking-tight flex-shrink-0" style={{ color: '#F0602C' }}>
                ATUM Scout
              </Link>
              <div className="flex gap-6">
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900 transition font-medium"
                >
                  Overview
                </Link>
                <Link
                  href="/researchers"
                  className="text-sm text-gray-600 hover:text-gray-900 transition font-medium"
                >
                  Researchers
                </Link>
                <Link
                  href="/tech-offers"
                  className="text-sm text-gray-600 hover:text-gray-900 transition font-medium"
                >
                  Tech Offers
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
