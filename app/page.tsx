'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send, FolderOpen, Trophy, Landmark, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import Image from 'next/image';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-24 pb-12 px-6 text-center animate-in zoom-in-95 duration-700 fade-in">

        {/* Logo Badge */}
        <div className="mb-10 relative group">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/40 transition-colors duration-500" />
          <div className="relative w-36 h-36 bg-card/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border-4 border-primary/20 group-hover:scale-105 transition-transform duration-500">
            <Image src="/otlak-logo.png" alt="Otlak" width={100} height={100} className="rounded-full" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground font-bold text-sm px-4 py-1 rounded-full shadow-lg tracking-widest uppercase">Otlak</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tighter max-w-3xl mx-auto leading-tight">
          Notların <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">Dijital Yüzü</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Üniversite notlarını paylaş, bilgiye eriş ve topluluğun bir parçası olarak kazanmaya başla.
        </p>

        {/* Call to Action */}
        {!session ? (
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
            >
              Hemen Başla
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-card/50 hover:bg-card border border-border text-foreground text-lg font-bold rounded-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              Giriş Yap
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              href="/notes"
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
            >
              Notlara Göz At
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Feature 1 */}
          <div className="bg-card/40 backdrop-blur-md border border-white/10 dark:border-white/5 p-8 rounded-3xl hover:bg-card/60 transition-colors group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Not Paylaş</h3>
            <p className="text-muted-foreground leading-relaxed">
              Ders notlarını kolayca yükle ve binlerce öğrenciyle paylaşarak bilgi ağını genişlet.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card/40 backdrop-blur-md border border-white/10 dark:border-white/5 p-8 rounded-3xl hover:bg-card/60 transition-colors group">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <FolderOpen className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Bilgiye Eriş</h3>
            <p className="text-muted-foreground leading-relaxed">
              İhtiyacın olan ders notlarına anında ulaş, sınavlara eksiksiz hazırlan.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card/40 backdrop-blur-md border border-white/10 dark:border-white/5 p-8 rounded-3xl hover:bg-card/60 transition-colors group">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-7 h-7 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Ödüller Kazan</h3>
            <p className="text-muted-foreground leading-relaxed">
              Topluluğa katkıda bulunarak puanlar topla ve sürpriz ödüllerin sahibi ol.
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-lg py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">&copy; 2026 Otlak Platform. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
