'use client'

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
    const { data: session } = useSession()

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold text-blue-600">İmdatulan.com</span>
                            <span className="ml-4 hidden text-sm text-gray-500 sm:block italic border-l pl-4">
                                "Kanka kimseye atma olur mu?"
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                            Anasayfa
                        </Link>

                        {session ? (
                            <>
                                <Link href="/upload" className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                                    Not Yükle
                                </Link>
                                <div className="text-gray-700 text-sm hidden md:block">
                                    {session.user?.email}
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Çıkış
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/signin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                                    Giriş Yap
                                </Link>
                                <Link href="/auth/signup" className="text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium">
                                    Kaydol
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
