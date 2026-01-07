'use client';

import { Menu, Landmark } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
// I will build a custom simple mobile drawer to avoid dependency hell if shadcn isn't fully set up.
// Actually, I can just use a simple state to show/hide a fixed overlay.

export default function MobileHeader() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden flex items-center justify-between px-4 h-16 bg-[#002A30] border-b border-[#003E44] sticky top-0 z-40">
            <Link href="/" className="flex items-center gap-2">
                <div className="border border-[#075985] rounded-full p-1">
                    <Landmark className="h-4 w-4 text-[#22d3ee]" />
                </div>
                <span className="text-sm font-bold text-[#22d3ee] tracking-widest">OTLAK</span>
            </Link>

            <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
                <Menu className="h-6 w-6" />
            </button>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-[#002A30] p-4 animate-in slide-in-from-right">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-xl font-bold text-white">Menü</span>
                        <button onClick={() => setIsOpen(false)} className="text-white p-2 bg-white/10 rounded-full">
                            X
                        </button>
                    </div>
                    <nav className="flex flex-col space-y-4">
                        <Link href="/" onClick={() => setIsOpen(false)} className="text-white text-lg font-medium py-2 border-b border-white/10">Ana Sayfa</Link>
                        <Link href="/top-noder" onClick={() => setIsOpen(false)} className="text-white text-lg font-medium py-2 border-b border-white/10">Top Noder</Link>
                        <Link href="/upload" onClick={() => setIsOpen(false)} className="text-[#22d3ee] text-lg font-medium py-2 border-b border-white/10">Not Yükle</Link>
                        <Link href="/profile" onClick={() => setIsOpen(false)} className="text-white text-lg font-medium py-2 border-b border-white/10">Profilim</Link>
                    </nav>

                    {/* Mobil User Info */}
                    <div className="mt-8 border-t border-white/10 pt-4">
                        {/* Burada session'a erişmek için useSession gerekiyor, ancak bu bileşende hook yok.
                             Basitlik için şimdilik hook ekleyelim. */}
                        <MobileUserDisplay />
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component for session access to keep main cleaner/lighter if needed
import { useSession } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

function MobileUserDisplay() {
    const { data: session } = useSession();

    if (!session) {
        return (
            <div className="flex flex-col gap-3">
                <Link href="/auth/signin" className="w-full text-center py-3 bg-[#075985] text-white rounded-lg font-bold">Giriş Yap</Link>
                <Link href="/auth/signup" className="w-full text-center py-3 border border-[#22d3ee] text-[#22d3ee] rounded-lg font-bold">Kayıt Ol</Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white font-bold ring-2 ring-[#22d3ee]">
                    {(session.user?.name || 'K').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <p className="text-white font-bold text-lg">{(session.user as any).name}</p>
                    <p className="text-[#22d3ee] font-medium flex items-center gap-1">
                        Mevcut Süt: {(session.user as any).credits ?? '-'} 🥛
                    </p>
                </div>
            </div>

            <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 mt-2"
            >
                <LogOut className="w-5 h-5" />
                <span>Çıkış Yap</span>
            </button>
        </div>
    )
}
