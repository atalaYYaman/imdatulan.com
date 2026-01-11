'use client';

import { useState } from "react";
import { Send, FileText, CheckCircle, UploadCloud, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { submitFeedback } from "@/app/actions/feedbackActions";

export default function FeedbackPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        if (file) {
            formData.set("file", file);
        }

        const result = await submitFeedback(formData);

        if (result.success) {
            setSuccess(true);
        } else {
            alert(result.message);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in-95">
                <div className="h-20 w-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-bold mb-4">Geri Bildirim Alındı! 🐮</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                    Değerli görüşleriniz bizim için çok önemli. Teşekkür ederiz.
                </p>
                <Link href="/">
                    <Button>Ana Sayfaya Dön</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-12 pb-24 md:pb-12">
            <div className="max-w-xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Bize Yazın</h1>
                    <p className="text-muted-foreground">Öneri, şikayet veya hata bildirimi. Seni dinliyoruz.</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Konu Seçimi */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Konu</label>
                            <div className="relative">
                                <select
                                    name="topic"
                                    required
                                    className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground text-sm focus:border-primary outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">Seçiniz...</option>
                                    <option value="Öneri">💡 Öneri</option>
                                    <option value="Hata Bildirimi">🐛 Hata Bildirimi</option>
                                    <option value="Şikayet">🚨 Şikayet</option>
                                    <option value="Diğer">💬 Diğer</option>
                                </select>
                            </div>
                        </div>

                        {/* Mesaj */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-semibold text-muted-foreground block">Mesajınız</label>
                            </div>
                            <textarea
                                name="message"
                                required
                                rows={5}
                                maxLength={2000}
                                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground text-sm focus:border-primary outline-none placeholder-muted-foreground resize-none"
                                placeholder="Düşüncelerinizi detaylıca anlatın..."
                            />
                        </div>

                        {/* Dosya Yükleme (Opsiyonel) */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Ekran Görüntüsü (Opsiyonel)</label>
                            <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center hover:bg-accent/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const selected = e.target.files?.[0];
                                        if (selected) {
                                            if (selected.size > 4 * 1024 * 1024) {
                                                alert("Dosya boyutu 4MB'dan büyük olamaz.");
                                                e.target.value = ""; // Reset input
                                                setFile(null);
                                            } else {
                                                setFile(selected);
                                            }
                                        } else {
                                            setFile(null);
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {file ? (
                                    <div className="text-center">
                                        <div className="h-10 w-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm font-medium">{file.name}</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <UploadCloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <span className="text-sm">Görsel Seç veya Sürükle</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-4 text-base"
                            disabled={loading}
                        >
                            {loading ? "Gönderiliyor..." : "Gönder"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
