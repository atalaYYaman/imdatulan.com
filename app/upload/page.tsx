'use client';

import { useState, useCallback } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function UploadPage() {
    const { data: session } = useSession();
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        courseName: "",
        term: "",
        description: "",
        noteType: "Ders Notu",
        price: 1
    });
    const [loading, setLoading] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !formData.courseName) return;

        setLoading(true); // Using existing loading state from somewhere? No, need to add it locally first if not present.
        // Wait, looking at previous view_file, there is NO loading state in UploadPage.
        // I need to add it.

        try {
            const data = new FormData();
            data.append("file", file);
            data.append("courseName", formData.courseName);
            data.append("term", formData.term);
            data.append("description", formData.description);
            data.append("noteType", formData.noteType);
            data.append("price", formData.price.toString());

            const res = await fetch("/api/upload", {
                method: "POST",
                body: data,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Yükleme başarısız");
            }

            setShowModal(true);
        } catch (error) {
            console.error(error);
            alert("Bir hata oluştu: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 text-white bg-[#01353D]">
                <div className="bg-[#002A30] p-8 rounded-3xl border border-[#003E44] shadow-2xl max-w-lg w-full">
                    <div className="h-20 w-20 bg-[#22d3ee]/10 text-[#22d3ee] rounded-full flex items-center justify-center mx-auto mb-6">
                        <UploadCloud className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Not Yüklemek İçin Giriş Yap</h1>
                    <p className="text-gray-400 mb-8">
                        Notlarını paylaşarak puanlar ve ödüller kazanmak için hemen hesabına giriş yap.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/signin" className="px-8 py-3 bg-[#22d3ee] text-[#002A30] font-bold rounded-xl hover:bg-[#0ea5e9] transition-colors">
                            Giriş Yap
                        </Link>
                        <Link href="/auth/signup" className="px-8 py-3 border border-[#22d3ee]/30 text-[#22d3ee] font-bold rounded-xl hover:bg-[#22d3ee]/10 transition-colors">
                            Kayıt Ol
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#01353D] text-white p-4 md:p-12 pb-24 md:pb-12">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Not Yükle & Kazan</h1>
                    <p className="text-gray-400">Paylaştığın her onaylı not için puan ve <span className="text-[#22d3ee]">para ödülü</span> kazanabilirsin.</p>
                </div>

                <div className="bg-[#002A30] border border-[#003E44] rounded-2xl p-8 shadow-2xl relative">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload Area */}
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer relative ${dragActive ? "border-[#22d3ee] bg-[#22d3ee]/5" : "border-gray-600 hover:border-gray-500 hover:bg-white/5"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleChange}
                                accept=".pdf,.doc,.docx,.jpg,.png"
                            />

                            {file ? (
                                <div className="text-center">
                                    <div className="h-12 w-12 bg-[#22d3ee]/20 text-[#22d3ee] rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium text-white mb-1">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setFile(null); }}
                                        className="mt-3 text-xs text-red-400 hover:text-red-300 z-20 relative"
                                    >
                                        Dosyayı Kaldır
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="h-12 w-12 bg-gray-700/50 text-gray-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <UploadCloud className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium text-white mb-1">Dosyayı sürükle veya seç</p>
                                    <p className="text-xs text-gray-500">PDF, JPG, DOC (Max 10MB)</p>
                                </div>
                            )}
                        </div>

                        {/* Text Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-300 mb-1 block">Ders Adı</label>
                                <input
                                    name="courseName"
                                    value={formData.courseName}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full bg-[#01353D] border border-[#003E44] rounded-xl py-2 px-3 text-white text-sm focus:border-[#22d3ee] outline-none placeholder-gray-600"
                                    placeholder="Örn: Fizik 101"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-300 mb-1 block">Yıl ve Dönem</label>
                                <div className="relative">
                                    <select
                                        name="term"
                                        value={formData.term}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full bg-[#01353D] border border-[#003E44] rounded-xl py-2 px-3 text-white text-sm focus:border-[#22d3ee] outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Array.from({ length: 17 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                            <>
                                                <option key={`${year}-guz`} value={`${year} Güz`}>{year} Güz</option>
                                                <option key={`${year}-bahar`} value={`${year} Bahar`}>{year} Bahar</option>
                                                <option key={`${year}-yaz`} value={`${year} Yaz`}>{year} Yaz</option>
                                            </>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-300 block">Açıklama</label>
                                <span className="text-[10px] text-gray-500">{formData.description.length}/1000</span>
                            </div>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                rows={4}
                                maxLength={1000}
                                className="w-full bg-[#01353D] border border-[#003E44] rounded-xl py-3 px-4 text-white text-sm focus:border-[#22d3ee] outline-none placeholder-gray-600 resize-none"
                                placeholder="Not içeriği hakkında diğer öğrencilere bilgi ver... (İsteğe bağlı)"
                            />
                        </div>

                        {/* Note Type */}
                        <div>
                            <label className="text-xs font-semibold text-gray-300 mb-2 block">Not Türü</label>
                            <div className="flex flex-wrap gap-2">
                                {['Ders Notu', 'İmdat Sorular', 'Ödev', 'Slayt'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, noteType: type }))}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${formData.noteType === type
                                            ? "bg-[#22d3ee] text-[#002A30] border-[#22d3ee]"
                                            : "bg-transparent border-[#003E44] text-gray-400 hover:text-white hover:border-gray-500"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Selection */}
                        <div>
                            <label className="text-xs font-semibold text-gray-300 mb-2 block">Not Fiyatı (Süt)</label>
                            <div className="flex gap-4">
                                {[1, 2, 3].map((price) => (
                                    <label key={price} className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${formData.price === price
                                        ? "bg-[#22d3ee] border-[#22d3ee] text-[#002A30]"
                                        : "bg-[#01353D] border-[#003E44] text-gray-400 hover:border-gray-500"
                                        }`}>
                                        <input
                                            type="radio"
                                            name="price"
                                            value={price}
                                            checked={formData.price === price}
                                            onChange={() => setFormData(prev => ({ ...prev, price: price }))}
                                            className="hidden"
                                        />
                                        <span className="font-bold text-lg">{price}</span>
                                        <span className="text-sm font-medium">Süt</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">
                                Notunuzu indiren/görüntüleyen kullanıcılardan bu miktar tahsil edilecek ve size aktarılacaktır.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-4 text-base shadow-[0_0_20px_rgba(34,211,238,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? "Yükleniyor..." : "Onaya Gönder"}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#002A30] border border-[#003E44] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="h-16 w-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Harika! 🎉</h2>
                        <p className="text-gray-300 text-sm mb-6">
                            Notun moderatörlerimiz tarafından incelenmek üzere alındı. <span className="font-semibold text-white">24 saat içinde</span> onaylanarak yayına alınacaktır.
                        </p>
                        <Link href="/">
                            <Button className="w-full">Ana Sayfaya Dön</Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
