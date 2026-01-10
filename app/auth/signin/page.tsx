
import React from 'react';
import SignInForm from '@/components/auth/SignInForm';
import Link from 'next/link';

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground dark:text-gray-100">
                    Giriş Yap
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Hesabınız yok mu?{' '}
                    <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
                        Hemen Kayıt Ol
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-border dark:border-gray-700">
                    <React.Suspense fallback={<div className="text-center text-muted-foreground">Yükleniyor...</div>}>
                        <SignInForm />
                    </React.Suspense>
                </div>
            </div>
        </div>
    );
}
