'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomInput } from '../ui/custom-input';
import { CustomCheckbox } from '../ui/custom-checkbox';

export default function SignInForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password
            });

            if (result?.error) {
                setError("Email veya şifre hatalı.");
            } else if (result?.ok) {
                // Force hard redirect to ensure session is picked up
                window.location.href = '/profile';
            } else {
                setError("Beklenmedik bir hata oluştu.");
            }
        } catch (err) {
            setError("Giriş işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {registered && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
                    <p className="text-green-700 text-sm">Kayıt başarılı! Lütfen giriş yapınız.</p>
                </div>
            )}

            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <CustomInput
                label="Email Adresi"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
            />

            <div className="relative">
                <CustomInput
                    label="Şifre"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-white text-sm"
                >
                    {showPassword ? "Gizle" : "Göster"}
                </button>
            </div>

            <div className="flex items-center justify-between">
                <CustomCheckbox
                    label="Beni Hatırla"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="mb-0" // Override margin
                />

                <div className="text-sm">
                    <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                        Şifremi unuttum?
                    </a>
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                >
                    {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
            </div>
        </form>
    );
}
