'use client'

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
    const { data: session } = useSession()

    return (
        <nav className="bg-white border-b border-gray-100 py-3">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <Link href="/" className="flex items-center flex-col leading-none">
                            <Landmark className="h-8 w-8 text-[#075985]" />
                            <span className="text-xs font-bold text-[#075985] tracking-widest">NOD</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/notes" className="text-sm font-medium text-[#075985] hover:text-[#0ea5e9]">
                                NODlar
                            </Link>
                            <Link href="/upload" className="text-sm font-medium text-[#075985] hover:text-[#0ea5e9]">
                                NOD Yükle
                            </Link>
                            <Link href="/top-noder" className="text-sm font-medium text-[#075985] hover:text-[#0ea5e9]">
                                Top Noder
                            </Link>
                            <Link href="/about" className="text-sm font-medium text-[#075985] hover:text-[#0ea5e9]">
                                Hakkımızda
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {session ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-[#075985] font-medium hidden sm:block">
                                    {session.user?.email}
                                </span>
                                <button
                                    onClick={() => signOut()}
                                    className="text-sm font-medium text-red-500 hover:text-red-600"
                                >
                                    Çıkış
                                </button>
                                <div className="h-8 w-8 rounded-full bg-[#e0f2fe] flex items-center justify-center text-[#0ea5e9]">
                                    <User className="h-5 w-5" />
                                </div>
                            </div>
                        ) : (
                            <Link href="/auth/signin" className="flex items-center gap-2 group">
                                <span className="text-sm font-medium text-[#0ea5e9] group-hover:text-[#0284c7]">
                                    Giriş Yap / Kayıt Ol
                                </span>
                                <div className="h-8 w-8 rounded-full border border-[#0ea5e9] flex items-center justify-center text-[#0ea5e9] group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                                    <User className="h-5 w-5" />
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

import { Landmark, User } from "lucide-react";
