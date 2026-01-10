'use client';

import { useState } from 'react';
import { verifyTwoFactor } from '@/app/actions/auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function VerifyEmailPage() {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');
    const router = useRouter();
    const { data: session, update } = useSession();

    // Ideally, we get email from session. If session is loading, we wait.
    // If not logged in, this page shouldn't work.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.email) {
            setMessage('Oturum bilgisi bulunamadı.');
            return;
        }

        setStatus('LOADING');
        setMessage('');

        const res = await verifyTwoFactor(code, session.user.email);

        if (res.success) {
            setStatus('SUCCESS');
            setMessage('Doğrulama başarılı! Yönlendiriliyorsunuz...');

            // Force session update to pick up new claim if we were using it in JWT
            // However, our middleware might just check DB or we rely on token refresh.
            // For now, let's just push to admin.
            await update();
            router.push('/admin');
        } else {
            setStatus('ERROR');
            setMessage(res.message || 'Bir hata oluştu.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Güvenlik Doğrulaması</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Admin paneline erişmek için email adresinize gönderilen kodu giriniz.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Doğrulama Kodu</label>
                        <div className="mt-1">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                                placeholder="6 haneli kod"
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {status === 'ERROR' && (
                        <div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm">
                            {message}
                        </div>
                    )}

                    {status === 'SUCCESS' && (
                        <div className="bg-green-50 p-3 rounded-lg text-green-600 text-sm">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'LOADING' || status === 'SUCCESS'}
                        className="flex w-full justify-center items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'LOADING' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Doğrula ve Devam Et
                    </button>

                    {/* Resend button could be added here */}
                </form>
            </div>
        </div>
    );
}
