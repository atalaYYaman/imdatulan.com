'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, User, Trophy, Heart, Upload, Menu, Landmark, FolderOpen, ShoppingBag, MessageSquare, ScrollText } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navigation = [
        { name: 'Ana Sayfa', href: '/', icon: Home },
        { name: 'Notlar', href: '/notes', icon: FolderOpen },
        ...(session ? [{ name: 'Profilim', href: '/profile', icon: User }] : []),
        ...((session?.user as any)?.role === 'ADMIN' ? [{ name: 'Admin Paneli', href: '/admin', icon: Landmark }] : []),
        { name: 'Store', href: '/store', icon: ShoppingBag },
        { name: 'Geliştirme', href: '/updates', icon: ScrollText },
        { name: 'Bize Yazın', href: '/feedback', icon: MessageSquare },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen bg-card/80 backdrop-blur-xl border-r border-border transition-all duration-300 ease-out w-20 hover:w-72 z-50 group overflow-hidden shadow-2xl">
            {/* Logo Area */}
            <div className="flex items-center h-20 border-b border-border/50 px-4 relative">
                <Link href="/" className="flex items-center min-w-[3rem] group/logo">
                    <div className="flex-shrink-0 relative">
                        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
                        <Image
                            src="/otlak-logo.png"
                            alt="Otlak"
                            width={40}
                            height={40}
                            className="rounded-full border border-primary/20 p-0.5 object-cover relative z-10"
                        />
                    </div>
                    <span className="ml-4 text-xl font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden translate-x-4 group-hover:translate-x-0">
                        <span className="text-foreground">OTLAK</span>
                    </span>
                </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 flex flex-col py-6 space-y-1.5 px-3">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={item.name}
                            className={`flex items-center px-3 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 overflow-hidden whitespace-nowrap group/link ${active
                                ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            <Icon className={`h-6 w-6 flex-shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover/link:scale-110'}`} />
                            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}

                {/* CTA Button */}
                {session && (
                    <div className="mt-4 px-1">
                        <Link
                            href="/upload"
                            className="flex items-center px-3 py-3.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden whitespace-nowrap relative group/btn"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                            <Upload className="h-6 w-6 flex-shrink-0 relative z-10" />
                            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 relative z-10">
                                Ot Yükle
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
