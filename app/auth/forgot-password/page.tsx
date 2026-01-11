'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from '@/app/actions/auth';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import Image from 'next/image';

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
        <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
                <div className="text-center mb-8">
                    <div className="inline-flex justify-center mb-4 relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <div className="bg-card p-3 rounded-2xl shadow-lg border border-border relative z-10">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Şifremi Unuttum</h2>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                        Endişelenme, email adresini gir, sana sıfırlama kodu gönderelim.
                    </p>
                </div>

                <div className="bg-card/70 backdrop-blur-xl py-8 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 dark:border-white/5 rounded-2xl sm:px-10">
                    {status === 'SUCCESS' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                {message}
                            </div>
                            <Link
                                href={`/auth/new-password?email=${encodeURIComponent(email)}`}
                                className="w-full flex justify-center py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Kodu Gir ve Şifreyi Sıfırla
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                                    Email Adresi
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder="ornek@email.com"
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
                                Kod Gönder
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <Link href="/auth/signin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Giriş yap
                    </Link>
                </div>
            </div>
        </div>
    );
}
