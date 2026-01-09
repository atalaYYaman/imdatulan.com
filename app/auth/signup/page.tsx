
import React from 'react';
import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                    Kayıt Ol
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Hemen aramıza katıl ve notlarını paylaş!
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-border">
                    <SignUpForm />
                </div>
            </div>
        </div>
    );
}
