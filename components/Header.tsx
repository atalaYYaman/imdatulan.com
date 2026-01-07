'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="flex items-center justify-end p-4 h-20">
            {session ? (
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-3 focus:outline-none group"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-white group-hover:text-[#22d3ee] transition-colors">
                                {(session.user as any).name || 'Kullanıcı'}
                            </p>
                            <p className="text-xs font-medium text-[#22d3ee] flex items-center justify-end gap-1">
                                Mevcut Süt: {(session.user as any).credits !== undefined ? (session.user as any).credits : '-'} <span className="text-sm">🥛</span>
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white font-bold ring-2 ring-[#003E44] group-hover:ring-[#22d3ee] transition-all shadow-lg overflow-hidden">
                            {/* Initials */}
                            {(session.user?.name || 'K').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-[#002A30] border border-[#003E44] rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-[#003E44] md:hidden">
                                <p className="text-sm font-medium text-white truncate">
                                    {session.user?.name || 'Kullanıcı'}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {session.user?.email}
                                </p>
                            </div>

                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center px-4 py-3 text-sm text-gray-200 hover:bg-white/5 hover:text-[#22d3ee] transition-colors"
                            >
                                <User className="w-4 h-4 mr-3" />
                                Profilim
                            </Link>

                            <button
                                onClick={() => signOut()}
                                className="flex w-full items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-[#003E44]"
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Çıkış Yap
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <Link
                        href="/auth/signin"
                        className="px-4 py-2 text-sm font-medium text-white bg-[#075985] rounded-lg hover:bg-[#0369a1] transition-colors"
                    >
                        Giriş Yap
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="px-4 py-2 text-sm font-medium text-[#22d3ee] border border-[#22d3ee]/30 rounded-lg hover:bg-[#22d3ee]/10 transition-colors"
                    >
                        Kayıt Ol
                    </Link>
                </div>
            )}
        </header>
    );
}
