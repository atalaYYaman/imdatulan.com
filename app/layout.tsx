import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import Header from "@/components/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ThemeProvider";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
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

                {/* Demo Banner */}
                <div className="bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 text-xs text-center py-1 font-medium border-b border-yellow-500/20">
                  Otlak (Beta) - Developed by Otlak Team
                </div>

                <main className="flex-1">
                  {children}
                  <SpeedInsights />
                </main>
              </div>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
