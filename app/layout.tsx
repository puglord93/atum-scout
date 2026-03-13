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
        <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-10">
                <Link href="/" className="text-2xl font-bold tracking-tight" style={{ color: '#F0602C' }}>
                  ATUM Scout
                </Link>
                <div className="flex gap-8">
                  <Link
                    href="/researchers"
                    className="text-gray-700 hover:text-primary transition font-medium"
                  >
                    Researchers
                  </Link>
                  <Link
                    href="/tech-offers"
                    className="text-gray-700 hover:text-primary transition font-medium"
                  >
                    Tech Offers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
