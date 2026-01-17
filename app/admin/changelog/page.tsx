'use client';

import { useState } from 'react';
import { createReleaseNote } from '@/app/actions/changelogActions';
import { Upload, Save, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminChangelogPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const result = await createReleaseNote(formData);

        if (result.success) {
            setMessage({ type: 'success', text: result.message! });
            (event.target as HTMLFormElement).reset();
            setFileName(null);
        } else {
            setMessage({ type: 'error', text: result.message! });
        }
        setIsLoading(false);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                alert("Dosya boyutu 4MB'dan büyük olamaz!");
                e.target.value = "";
                setFileName(null);
                return;
            }
            setFileName(file.name);
        } else {
            setFileName(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-black tracking-tight">Yeni Güncelleme Ekle</h1>
            </div>

            <div className="bg-card/60 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Status Message */}
                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            <p className="font-medium">{message.text}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">Güncelleme Başlığı</label>
                            <input
                                name="title"
                                required
                                type="text"
                                placeholder="Örn: Yeni Profil Sayfası Yayında!"
                                className="w-full bg-background/50 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all"
                            />
                        </div>

                        {/* Version */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">Sürüm No</label>
                            <input
                                name="version"
                                required
                                type="text"
                                placeholder="Major.Minor.Patch.Design.Special (Örn: 1.2.0.1.0)"
                                className="w-full bg-background/50 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold ml-1">Detaylı Açıklama</label>
                        <textarea
                            name="description"
                            required
                            rows={6}
                            placeholder="Bu güncellemede neler değişti? Kullanıcıları bilgilendir..."
                            className="w-full bg-background/50 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all resize-y"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold ml-1">Görsel (Opsiyonel)</label>
                        <div className="relative group cursor-pointer">
                            <input
                                type="file"
                                name="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${fileName ? 'border-primary/50 bg-primary/5' : 'border-border group-hover:border-primary/50 bg-background/30'
                                }`}>
                                <div className={`p-3 rounded-full mb-3 transition-transform duration-300 ${fileName ? 'bg-primary/20 text-primary scale-110' : 'bg-muted text-muted-foreground group-hover:scale-110'
                                    }`}>
                                    {fileName ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                </div>
                                <p className={`text-sm font-medium transition-colors ${fileName ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                    {fileName ? fileName : 'Görsel yüklemek için tıklayın veya sürükleyin'}
                                </p>
                                {!fileName && <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, GIF (Max 4MB)</p>}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Yayına Al</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
