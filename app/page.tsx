'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send, FolderOpen, Trophy, User, Landmark } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#01353D] text-white font-sans selection:bg-[#22d3ee] selection:text-[#002A30]">

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-20 pb-12 px-6 text-center animate-in fade-in zoom-in duration-500">

        {/* Logo Circle */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <Landmark className="h-16 w-16 text-[#002A30]" />
          </div>
          <div className="absolute -bottom-2 w-full text-center">
            <span className="bg-[#002A30] text-[#22d3ee] font-black text-xl px-2 py-0.5 tracking-widest border border-[#22d3ee] rounded">NOD</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#22d3ee] mb-8 tracking-tight drop-shadow-lg">
          Notun Dijital Yüzü
        </h1>

        {/* Buttons (Only show if not logged in, or redirect if logged in) */}
        {!session && (
          <div className="flex gap-4 mb-16 scale-100 hover:scale-105 transition-transform duration-200">
            <Link
              href="/auth/signup"
              className="px-8 py-2.5 bg-[#22d3ee] text-[#002A30] text-sm font-bold rounded-full shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:bg-[#0ea5e9] transition-all"
            >
              Kayıt Ol
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-2.5 bg-white text-[#002A30] text-sm font-bold rounded-full hover:bg-gray-200 transition-all border border-gray-200"
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
            <Send className="w-full h-full text-[#22d3ee] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] transform group-hover:-translate-y-2 group-hover:rotate-6 transition-all duration-500" strokeWidth={1} />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#22d3ee] mb-2">Not Paylaş</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Üniversite hayatın boyunca hazırladığın tüm notları paylaş, bilgiye değer kat.
            </p>
          </div>
        </div>

        {/* Feature 2 (Reverse Layout for variety) */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 group">
          <div className="w-32 h-32 flex-shrink-0 bg-transparent flex items-center justify-center">
            <FolderOpen className="w-full h-full text-[#22d3ee] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] transform group-hover:scale-110 transition-all duration-500" strokeWidth={1} />
          </div>
          <div className="text-center md:text-right">
            <h2 className="text-3xl font-bold text-[#22d3ee] mb-2">Notlara Eriş</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Kendi notlarını paylaşarak diğer kullanıcıların paylaştıkları hazinelere erişmeye başla.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col md:flex-row items-center gap-8 group">
          <div className="w-32 h-32 flex-shrink-0 bg-transparent flex items-center justify-center">
            <Trophy className="w-full h-full text-[#22d3ee] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] transform group-hover:rotate-12 transition-all duration-500" strokeWidth={1} />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#22d3ee] mb-2">Ödülleri Kazan</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Not paylaşarak platformun aylık kazancından pay alabilir, bölümünün yıldızı olabilirsin.
            </p>
          </div>
        </div>

      </div>

      {/* Footer / Copyright */}
      <footer className="text-center py-6 text-gray-500 text-sm border-t border-[#003E44] bg-[#002A30]/50 backdrop-blur-sm">
        <p>&copy; 2026 NOD Platform. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
