
import React from 'react';
import SignInForm from '@/components/auth/SignInForm';
import Link from 'next/link';
import Image from 'next/image';

export default function SignInPage() {
    return (
        <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                        <Image
                            src="/otlak-logo.png"
                            alt="Otlak Logo"
                            width={80}
                            height={80}
                            className="relative z-10 rounded-full border-2 border-primary/30"
                        />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-foreground tracking-tight">
                    Tekrar Hoşgeldin! 👋
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Notlarına erişmek için giriş yap.
                </p>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Hesabınız yok mu?{' '}
                    <Link href="/auth/signup" className="font-bold text-primary hover:text-primary/80 transition-colors">
                        Hemen Kayıt Ol
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
                <div className="bg-card/70 backdrop-blur-xl py-8 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 dark:border-white/5 rounded-2xl sm:px-10">
                    <React.Suspense fallback={<div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                        <SignInForm />
                    </React.Suspense>
                </div>
            </div>
        </div>
    );
}
