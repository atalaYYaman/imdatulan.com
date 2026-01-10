'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from '@/app/actions/auth';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('LOADING');
        setMessage('');

        const res = await sendPasswordResetEmail(email);

        if (res.success) {
            setStatus('SUCCESS');
            setMessage('Sıfırlama kodu gönderildi. Lütfen kodunuzu bir yere not edin ve şifrenizi sıfırlamak için aşağıdaki butona tıklayın.');
        } else {
            setStatus('ERROR');
            setMessage(res.message || 'Bir hata oluştu.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Şifremi Unuttum</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Email adresinizi girin, size bir sıfırlama kodu gönderelim.
                    </p>
                </div>

                {status === 'SUCCESS' ? (
                    <div className="space-y-6">
                        <div className="bg-green-50 p-4 rounded-lg text-green-700 text-sm">
                            {message}
                        </div>
                        <Link
                            href={`/auth/new-password?email=${encodeURIComponent(email)}`}
                            className="w-full flex justify-center py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                        >
                            Kodu Gir ve Şifreyi Sıfırla
                        </Link>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Adresi
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                            />
                        </div>

                        {status === 'ERROR' && (
                            <div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'LOADING'}
                            className="flex w-full justify-center items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'LOADING' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kod Gönder
                        </button>

                        <div className="text-center text-sm">
                            <Link href="/auth/signin" className="text-emerald-600 hover:text-emerald-500 font-medium">
                                Giriş sayfasına dön
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
