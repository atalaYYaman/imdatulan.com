
import React from 'react';
import SignInForm from '@/components/auth/SignInForm';
import Link from 'next/link';

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Giriş Yap
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Hesabınız yok mu?{' '}
                    <Link href="/auth/signup" className="font-medium text-teal-600 hover:text-teal-500">
                        Hemen Kayıt Ol
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <React.Suspense fallback={<div className="text-center">Yükleniyor...</div>}>
                        <SignInForm />
                    </React.Suspense>
                </div>

                {/* Footer Links */}
                <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
                    <p>
                        <Link href="/support/missing-university" className="font-medium text-teal-600 hover:text-teal-500">
                            Üniversiteniz listede yok mu?
                        </Link>
                    </p>
                    <p>
                        <Link href="/support/login-issue" className="font-medium text-teal-600 hover:text-teal-500">
                            Giriş sorunu mu yaşıyorsunuz?
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
