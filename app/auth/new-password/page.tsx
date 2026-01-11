'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/app/actions/auth';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
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
            <div className="flex min-h-screen items-center justify-center p-4 bg-background overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" />
                </div>
                <div className="w-full max-w-md bg-card/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-border text-center space-y-6 relative z-10 animate-in zoom-in-95 duration-500">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 ring-4 ring-green-500/5">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Şifre Değiştirildi</h3>
                        <p className="text-muted-foreground mt-2">{message}</p>
                    </div>
                    <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                        <div className="h-full bg-primary w-full animate-[shimmer_2s_infinite]" style={{ width: '100%', animation: 'progress 3s linear' }} />
                    </div>
                    <p className="text-xs text-muted-foreground">Yönlendiriliyorsunuz...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
                <div className="text-center mb-8">
                    <div className="inline-flex justify-center mb-4 relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <div className="bg-card p-3 rounded-2xl shadow-lg border border-border relative z-10">
                            <KeyRound className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Yeni Şifre Belirle</h2>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                        Emailinize gelen 6 haneli kodu ve yeni şifrenizi girin.
                    </p>
                </div>

                <div className="bg-card/70 backdrop-blur-xl py-8 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 dark:border-white/5 rounded-2xl sm:px-10">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="block w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Doğrulama Kodu</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="6 haneli kod"
                                required
                                className="block w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm outline-none transition-all tracking-widest text-center font-mono font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Yeni Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="block w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm outline-none transition-all"
                            />
                        </div>

                        {status === 'ERROR' && (
                            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-destructive text-sm font-medium animate-in shake">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'LOADING'}
                            className="flex w-full justify-center items-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'LOADING' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Şifreyi Değiştir
                        </button>

                        <div className="text-center text-sm">
                            <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80 font-medium hover:underline">
                                Yeni kod iste
                            </Link>
                        </div>
                    </form>
                </div>
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
