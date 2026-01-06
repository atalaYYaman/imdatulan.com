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
                <span className="text-sm font-bold text-[#22d3ee] tracking-widest">NOD</span>
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
                </div>
            )}
        </div>
    );
}
