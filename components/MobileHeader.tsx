'use client';

import { Menu, X, Home, User, FolderOpen, ShoppingBag, MessageSquare, Upload, LogOut, ChevronRight, Moon, Sun, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

export default function MobileHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const { data: session } = useSession();

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const navigation = [
        { name: 'Ana Sayfa', href: '/', icon: Home },
        { name: 'Notlar', href: '/notes', icon: FolderOpen },
        { name: 'Mağaza', href: '/store', icon: ShoppingBag },
        { name: 'Bize Yazın', href: '/feedback', icon: MessageSquare },
    ];

    return (
        <>
            <div className="md:hidden flex items-center justify-between px-4 h-16 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40 transition-colors duration-300">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                        <Image
                            src="/otlak-logo.png"
                            alt="Otlak"
                            width={32}
                            height={32}
                            className="rounded-full border border-primary/20 p-0.5 object-cover relative z-10"
                        />
                    </div>
                    <span className="text-lg font-bold tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">OTLAK</span>
                </Link>

                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 -mr-2 text-foreground active:scale-95 transition-transform"
                    aria-label="Open Menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Side Drawer */}
            <div className={`fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-background border-l border-border z-50 shadow-2xl transform transition-transform duration-300 ease-out md:hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <span className="text-lg font-bold">Menü</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">

                    {/* User Profile Summary */}
                    {session ? (
                        <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-background">
                                    {(session.user?.name || 'K').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-foreground truncate">{session.user.name}</span>
                                    <span className="text-sm text-muted-foreground truncate">{session.user.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-background rounded-xl p-3 border border-border/50 shadow-sm">
                                <span className="text-sm font-medium text-muted-foreground">Bakiyeniz</span>
                                <span className="text-primary font-bold">{session.user.credits || 0} 🥛</span>
                            </div>
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="mt-3 flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/10"
                            >
                                Profilime Git
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href="/auth/signin"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center py-3 px-4 rounded-xl border border-border font-medium hover:bg-muted transition-colors"
                            >
                                Giriş Yap
                            </Link>
                            <Link
                                href="/auth/signup"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95"
                            >
                                Kayıt Ol
                            </Link>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-4 px-4 py-3.5 text-foreground/80 hover:text-foreground hover:bg-muted/60 rounded-xl transition-all font-medium group"
                                >
                                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    {item.name}
                                </Link>
                            )
                        })}

                        {session && (
                            <Link
                                href="/upload"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-4 px-4 py-3.5 text-primary font-bold bg-primary/5 rounded-xl transition-all mt-2 border border-primary/20"
                            >
                                <Upload className="h-5 w-5" />
                                Ot Yükle
                            </Link>
                        )}
                    </nav>

                    {/* Theme Toggle */}
                    <div className="pt-6 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Görünüm</p>
                        <div className="grid grid-cols-3 gap-2 bg-muted/50 p-1 rounded-xl">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex items-center justify-center p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Sun className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex items-center justify-center p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Moon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`flex items-center justify-center p-2 rounded-lg transition-all ${theme === 'system' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Monitor className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Drawer Footer */}
                {session && (
                    <div className="p-4 border-t border-border/50 bg-muted/30">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                signOut();
                            }}
                            className="flex items-center justify-center w-full gap-2 p-3 text-red-500 hover:text-red-400 font-medium hover:bg-red-500/5 rounded-xl transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Çıkış Yap
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
