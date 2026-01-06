
import React from 'react';
import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Kayıt Ol
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Hemen aramıza katıl ve notlarını paylaş!
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <SignUpForm />
                </div>

                {/* Footer Links as requested */}
                <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
                    <p>
                        <a href="/support/missing-university" className="font-medium text-teal-600 hover:text-teal-500">
                            Üniversiteniz listede yok mu?
                        </a>
                    </p>
                    <p>
                        <a href="/support/login-issue" className="font-medium text-teal-600 hover:text-teal-500">
                            Giriş sorunu mu yaşıyorsunuz?
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
