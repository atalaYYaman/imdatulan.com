'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send, FolderOpen, Trophy, User, Landmark } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-20 pb-12 px-6 text-center animate-in fade-in zoom-in duration-500">

        {/* Logo Circle */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)] dark:shadow-[0_0_40px_rgba(16,185,129,0.1)] border-4 border-primary/20">
            <Landmark className="h-16 w-16 text-primary" />
          </div>
          <div className="absolute -bottom-2 w-full text-center">
            <span className="bg-card text-primary font-black text-xl px-2 py-0.5 tracking-widest border border-primary rounded shadow-lg">OTLAK</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-8 tracking-tight drop-shadow-sm">
          Notun Dijital Yüzü
        </h1>

        {/* Buttons (Only show if not logged in, or redirect if logged in) */}
        {!session && (
          <div className="flex gap-4 mb-16 scale-100 hover:scale-105 transition-transform duration-200">
            <Link
              href="/auth/signup"
              className="px-8 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-primary/90 transition-all"
            >
              Kayıt Ol
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-2.5 bg-card text-foreground text-sm font-bold rounded-full hover:bg-accent transition-all border border-border"
            >
              Giriş Yap
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-24">

        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center gap-8 group">
          <div className="w-32 h-32 flex-shrink-0 bg-transparent flex items-center justify-center">
            <Send className="w-full h-full text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transform group-hover:-translate-y-2 group-hover:rotate-6 transition-all duration-500" strokeWidth={1} />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-primary mb-2">Not Paylaş</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Üniversite hayatın boyunca hazırladığın tüm notları paylaş, bilgiye değer kat.
            </p>
          </div>
        </div>

        {/* Feature 2 (Reverse Layout for variety) */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 group">
          <div className="w-32 h-32 flex-shrink-0 bg-transparent flex items-center justify-center">
            <FolderOpen className="w-full h-full text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transform group-hover:scale-110 transition-all duration-500" strokeWidth={1} />
          </div>
          <div className="text-center md:text-right">
            <h2 className="text-3xl font-bold text-primary mb-2">Notlara Eriş</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Kendi notlarını paylaşarak diğer kullanıcıların paylaştıkları hazinelere erişmeye başla.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col md:flex-row items-center gap-8 group">
          <div className="w-32 h-32 flex-shrink-0 bg-transparent flex items-center justify-center">
            <Trophy className="w-full h-full text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transform group-hover:rotate-12 transition-all duration-500" strokeWidth={1} />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-primary mb-2">Ödülleri Kazan</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Not paylaşarak platformun aylık kazancından pay alabilir, bölümünün yıldızı olabilirsin.
            </p>
          </div>
        </div>

      </div>

      {/* Footer / Copyright */}
      <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border bg-card/50 backdrop-blur-sm">
        <p>&copy; 2026 Otlak Platform. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
