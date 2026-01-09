'use client';

import { Menu, Landmark } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
// I will build a custom simple mobile drawer to avoid dependency hell if shadcn isn't fully set up.
// Actually, I can just use a simple state to show/hide a fixed overlay.

export default function MobileHeader() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden flex items-center justify-between px-4 h-16 bg-card border-b border-border sticky top-0 z-40">
            <Link href="/" className="flex items-center gap-2">
                <div className="border border-primary rounded-full p-1">
                    <Landmark className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-primary tracking-widest">OTLAK</span>
            </Link>

            <button onClick={() => setIsOpen(!isOpen)} className="text-foreground p-2">
                <Menu className="h-6 w-6" />
            </button>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-background p-4 animate-in slide-in-from-right">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-xl font-bold text-foreground">Menü</span>
                        <button onClick={() => setIsOpen(false)} className="text-foreground p-2 bg-primary/10 rounded-full">
                            X
                        </button>
                    </div>
                    <nav className="flex flex-col space-y-4">
                        <Link href="/" onClick={() => setIsOpen(false)} className="text-foreground text-lg font-medium py-2 border-b border-border">Ana Sayfa</Link>
                        <Link href="/top-noder" onClick={() => setIsOpen(false)} className="text-foreground text-lg font-medium py-2 border-b border-border">Top Noder</Link>
                        <Link href="/upload" onClick={() => setIsOpen(false)} className="text-primary text-lg font-bold py-2 border-b border-border">Ot Yükle</Link>
                        <Link href="/profile" onClick={() => setIsOpen(false)} className="text-foreground text-lg font-medium py-2 border-b border-border">Profilim</Link>
                    </nav>

                    {/* Mobil User Info */}
                    <div className="mt-8 border-t border-border pt-4">
                        <MobileUserDisplay />
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component for session access
import { useSession } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

function MobileUserDisplay() {
    const { data: session } = useSession();

    if (!session) {
        return (
            <div className="flex flex-col gap-3">
                <Link href="/auth/signin" className="w-full text-center py-3 bg-primary text-primary-foreground rounded-lg font-bold">Giriş Yap</Link>
                <Link href="/auth/signup" className="w-full text-center py-3 border border-primary text-primary rounded-lg font-bold">Kayıt Ol</Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold ring-2 ring-border">
                    {(session.user?.name || 'K').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <p className="text-foreground font-bold text-lg">{session.user.name}</p>
                    <p className="text-primary font-medium flex items-center gap-1">
                        Mevcut Süt: {session.user.credits ?? '-'} 🥛
                    </p>
                </div>
            </div>

            <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-red-500 hover:text-red-400 mt-2"
            >
                <LogOut className="w-5 h-5" />
                <span>Çıkış Yap</span>
            </button>
        </div>
    )
}
