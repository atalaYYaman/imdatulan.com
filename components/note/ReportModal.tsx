'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, X } from 'lucide-react';
import { createReport } from '@/app/actions/noteActions';

interface ReportModalProps {
    noteId: string;
    onClose: () => void;
}

const REPORT_REASONS = [
    "Alakasız içerik paylaşımı",
    "Hakaret içeren içerik paylaşımı",
    "Not - ders uyuşmazlığı",
    "Yanlış bilgi paylaşımı",
    "Telifli içerik paylaşımı",
    "Kötü niyetli yazılım/bağlantı",
    "Spam/Reklam",
    "Diğer"
];

export default function ReportModal({ noteId, onClose }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReason) {
            setError("Lütfen bir neden seçin.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await createReport(noteId, selectedReason, details);
            if (result.success) {
                setIsSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(result.message || "Bir hata oluştu.");
            }
        } catch (err) {
            setError("Beklenmedik bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-card w-full max-w-md rounded-2xl p-8 border border-border shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Şikayetiniz Alındı</h2>
                    <p className="text-muted-foreground">Bildiriminiz için teşekkürler. İnceleyip gereğini yapacağız.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="font-bold">Notu Şikayet Et</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full text-muted-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">

                    <p className="text-sm text-muted-foreground mb-4">
                        Bu içeriğin topluluk kurallarımıza uymadığını düşünüyorsanız lütfen bize bildirin.
                    </p>

                    <div className="space-y-3 mb-6">
                        {REPORT_REASONS.map((reason) => (
                            <label key={reason} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedReason === reason
                                    ? 'border-red-500 bg-red-500/5 ring-1 ring-red-500'
                                    : 'border-border hover:border-red-500/50 hover:bg-muted/50'
                                }`}>
                                <input
                                    type="radio"
                                    name="reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="hidden" // Custom styling handled by parent div
                                />
                                <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${selectedReason === reason ? 'border-red-500' : 'border-muted-foreground'
                                    }`}>
                                    {selectedReason === reason && <div className="w-2 h-2 rounded-full bg-red-500" />}
                                </div>
                                <span className="text-sm font-medium text-foreground">{reason}</span>
                            </label>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="text-sm font-bold text-foreground mb-2 block">Detaylar (İsteğe bağlı)</label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Lütfen sorunu daha detaylı açıklayın..."
                            className="w-full bg-input border border-border rounded-xl p-3 h-24 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            İptal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                            {isSubmitting ? 'Gönderiliyor...' : 'Şikayet Et'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
