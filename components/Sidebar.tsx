'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Trophy, Heart, Upload, Menu, Landmark, FolderOpen, ShoppingBag } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navigation = [
        { name: 'Ana Sayfa', href: '/', icon: Home },
        { name: 'Notlar', href: '/notes', icon: FolderOpen },
        ...(session ? [{ name: 'Profilim', href: '/profile', icon: User }] : []),
        { name: 'Mağaza', href: '/store', icon: ShoppingBag },
        { name: 'Bağış Yap', href: '/donate', icon: Heart },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen bg-[#002A30] border-r border-[#003E44] transition-all duration-300 ease-in-out w-20 hover:w-64 z-50 group overflow-hidden shadow-2xl">
            {/* Logo Area */}
            <div className="flex items-center h-20 border-b border-[#003E44] px-4 relative">
                {/* Icon always visible */}
                <Link href="/" className="flex items-center min-w-[3rem]">
                    <div className="border-2 border-[#075985] rounded-full p-1.5 flex-shrink-0">
                        <Landmark className="h-6 w-6 text-[#22d3ee]" />
                    </div>
                    {/* Text visible on hover */}
                    <span className="ml-3 text-lg font-bold text-[#22d3ee] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                        OTLAK
                    </span>
                </Link>
                {/* Hamburger Icon Suggestion (Visual only as hover does the job) */}
                <Menu className="h-6 w-6 text-gray-500 absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Navigation Links */}
            <div className="flex-1 flex flex-col py-6 space-y-2 px-3">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={item.name} // Tooltip for collapsed state
                            className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 overflow-hidden whitespace-nowrap ${active
                                ? 'bg-[#22d3ee]/10 text-[#22d3ee]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Icon className="h-6 w-6 flex-shrink-0" />
                            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}

                {/* CTA Button */}
                {session && (
                    <Link
                        href="/upload"
                        className="mt-6 flex items-center px-3 py-3 text-sm font-medium rounded-xl text-[#002A30] bg-[#22d3ee] hover:bg-[#0ea5e9] shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all hover:scale-105 overflow-hidden whitespace-nowrap"
                    >
                        <Upload className="h-6 w-6 flex-shrink-0" />
                        <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            NOD Yükle
                        </span>
                    </Link>
                )}
            </div>
        </aside>
    );
}
