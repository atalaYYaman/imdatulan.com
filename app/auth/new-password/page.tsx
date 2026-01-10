'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/app/actions/auth';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function NewPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const emailFromQuery = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailFromQuery);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');

    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('LOADING');
        setMessage('');

        const res = await resetPassword(code, email, password);

        if (res.success) {
            setStatus('SUCCESS');
            setMessage('Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.');
            setTimeout(() => {
                router.push('/auth/signin');
            }, 3000);
        } else {
            setStatus('ERROR');
            setMessage(res.message || 'Bir hata oluştu.');
        }
    };

    if (status === 'SUCCESS') {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Şifre Değiştirildi</h3>
                    <p className="text-sm text-gray-500">{message}</p>
                    <p className="text-xs text-gray-400">Yönlendiriliyorsunuz...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Yeni Şifre Belirle</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Emailinize gelen 6 haneli kodu ve yeni şifrenizi girin.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Doğrulama Kodu</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="6 haneli kod"
                            required
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Yeni Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
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
                        Şifreyi Değiştir
                    </button>

                    <div className="text-center text-sm">
                        <Link href="/auth/forgot-password" className="text-emerald-600 hover:text-emerald-500 font-medium">
                            Yeni kod iste
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function NewPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewPasswordForm />
        </Suspense>
    )
}
