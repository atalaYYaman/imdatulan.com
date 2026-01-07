import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OTLAK",
  description: "University Note Sharing Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#01353D] text-white`}
      >
        <SessionProvider>
          <div className="flex min-h-screen">
            {/* Sidebar for Desktop */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:ml-20 w-full transition-all duration-300">
              <MobileHeader />

              {/* Desktop Header for Profiles/Auth */}
              <div className="hidden md:block">
                <Header />
              </div>

              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
