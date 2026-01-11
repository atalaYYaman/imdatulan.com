'use client';

import { useState, useEffect, useCallback } from 'react';
import { verifyTwoFactor, sendTwoFactorEmail } from '@/app/actions/auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function VerifyEmailPage() {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [timer, setTimer] = useState(0);

    const router = useRouter();
    const { data: session, update } = useSession();

    const startTimer = useCallback(() => {
        setTimer(120); // 2 minutes
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendCode = async () => {
        if (!session?.user?.email) {
            setMessage('Oturum bilgisi bulunamadı.');
            return;
        }

        setStatus('LOADING');
        setMessage('');

        const res = await sendTwoFactorEmail(session.user.email);

        if (res.success) {
            setStatus('IDLE');
            setIsCodeSent(true);
            setMessage('Kod gönderildi!');
            startTimer();
        } else {
            setStatus('ERROR');
            setMessage(res.message || 'Bir hata oluştu.');
        }
    };

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
            await update();
            // Force hard navigation to ensure cookie is updated for middleware
            router.refresh();
            window.location.href = '/admin';
        } else {
            setStatus('ERROR');
            setMessage(res.message || 'Bir hata oluştu.');
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border dark:border-gray-700">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Güvenlik Doğrulaması</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Admin paneline erişmek için doğrulama yapmanız gerekmektedir.
                    </p>
                </div>

                {!isCodeSent ? (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
                            Devam etmek için lütfen aşağıdaki butona tıklayarak kod isteyin.
                        </div>
                        {status === 'ERROR' && (
                            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-300 text-sm">
                                {message}
                            </div>
                        )}
                        <button
                            onClick={handleSendCode}
                            disabled={status === 'LOADING'}
                            className="w-full flex justify-center py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50"
                        >
                            {status === 'LOADING' ? <Loader2 className="animate-spin" /> : 'Doğrulama Kodu Gönder'}
                        </button>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Doğrulama Kodu
                                {timer > 0 && <span className="ml-2 text-emerald-600 font-bold">({formatTime(timer)})</span>}
                                {timer === 0 && <span className="ml-2 text-red-500 font-bold">(Süre Doldu)</span>}
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    placeholder="6 haneli kod"
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {status === 'ERROR' && (
                            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-300 text-sm">
                                {message}
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-300 text-sm">
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

                        {timer === 0 && (
                            <button
                                type="button"
                                onClick={handleSendCode}
                                className="w-full text-sm text-emerald-600 hover:text-emerald-500 underline"
                            >
                                Yeni kod gönder
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
