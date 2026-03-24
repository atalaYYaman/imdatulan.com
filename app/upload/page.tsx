'use client';

import React, { useState, useCallback, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle, Sparkles, ChevronRight, Info, Gift, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { upload } from '@vercel/blob/client';
import { universities } from "@/lib/universityData";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB (Vercel Pro limit)
const MAX_FILES = 20;
const ALLOWED_EXT = /\.(pdf|png|jpg|jpeg)$/i;

type FileWithPreview = {
    file: File;
    preview?: string; // object URL for images
    id: string;
};

function getFileExtension(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext) ? ext : 'pdf';
}

function isImageFile(file: File): boolean {
    const ext = getFileExtension(file.name);
    return ['jpg', 'jpeg', 'png'].includes(ext);
}

export default function UploadPage() {
    const { data: session } = useSession();
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        courseName: "",
        term: "",
        university: "",
        faculty: "",
        department: "",
        description: "",
        noteType: "Ders Notu",
        price: 2,
        isAI: false
    });
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Revoke object URLs on unmount or when files change
    useEffect(() => {
        return () => {
            files.forEach(f => {
                if (f.preview) URL.revokeObjectURL(f.preview);
            });
        };
    }, []);

    const addFiles = useCallback((newFiles: File[]) => {
        const filtered = Array.from(newFiles).filter(f => ALLOWED_EXT.test(f.name));
        if (filtered.length !== newFiles.length) {
            alert('Sadece PDF, JPG ve PNG dosyaları kabul edilir. Diğer dosyalar atlandı.');
        }
        const toAdd: FileWithPreview[] = filtered.map((file, idx) => {
            const id = `${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`;
            const preview = isImageFile(file) ? URL.createObjectURL(file) : undefined;
            return { file, preview, id };
        });

        setFiles(prev => {
            const combined = [...prev, ...toAdd];
            if (combined.length > MAX_FILES) {
                toAdd.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
                alert(`En fazla ${MAX_FILES} dosya yükleyebilirsiniz. İlk ${MAX_FILES} dosya eklendi.`);
                return combined.slice(0, MAX_FILES);
            }
            const totalSize = combined.reduce((s, f) => s + f.file.size, 0);
            if (totalSize > MAX_SIZE) {
                toAdd.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
                const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
                alert(`Toplam boyut ${sizeMB}MB. Maksimum 25MB yükleyebilirsiniz.`);
                return prev;
            }
            return combined;
        });
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => {
            const item = prev.find(f => f.id === id);
            if (item?.preview) URL.revokeObjectURL(item.preview);
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
    }, [addFiles]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            addFiles(Array.from(e.target.files));
            e.target.value = "";
        }
    }, [addFiles]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === "university" ? { faculty: "", department: "" } : {}),
            ...(name === "faculty" ? { department: "" } : {}),
        }));
    };

    const totalSize = files.reduce((s, f) => s + f.file.size, 0);
    const selectedUniversity = universities.find((u) => u.name === formData.university);
    const availableFaculties = selectedUniversity?.faculties ?? [];
    const selectedFaculty = availableFaculties.find((f) => f.name === formData.faculty);
    const availableDepartments = selectedFaculty?.departments ?? [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!files.length || !formData.courseName) return;
        if (totalSize > MAX_SIZE) {
            alert(`Toplam boyut çok büyük! Maksimum 25MB.`);
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            const SMALL_FILE_THRESHOLD = 4 * 1024 * 1024; // 4MB
            const blobUrls: string[] = [];
            const fileNames: string[] = [];
            const total = files.length;
            let done = 0;

            for (let i = 0; i < files.length; i++) {
                const { file } = files[i];
                let blobUrl: string | null = null;

                if (file.size > SMALL_FILE_THRESHOLD) {
                    const blob = await upload(file.name, file, {
                        access: 'public',
                        handleUploadUrl: '/api/upload-handler',
                        onUploadProgress: (event) => {
                            const base = (done / total) * 100;
                            const current = (event.percentage / 100) * (1 / total) * 100;
                            setUploadProgress(Math.round(base + current));
                        },
                    });
                    blobUrl = blob.url;
                } else {
                    blobUrl = await new Promise<string>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        const blobFormData = new FormData();
                        blobFormData.append("file", file);
                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable) {
                                const base = (done / total) * 100;
                                const current = (event.loaded / event.total) * (1 / total) * 100;
                                setUploadProgress(Math.round(base + current));
                            }
                        };
                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                try {
                                    resolve(JSON.parse(xhr.responseText).url);
                                } catch { reject(new Error('Geçersiz yanıt')); }
                            } else {
                                try {
                                    const err = JSON.parse(xhr.responseText);
                                    reject(new Error(err.message || 'Yükleme başarısız'));
                                } catch {
                                    reject(new Error(`${xhr.status} ${xhr.statusText}`));
                                }
                            }
                        };
                        xhr.onerror = () => reject(new Error('Ağ hatası'));
                        xhr.open('POST', '/api/upload-blob-direct');
                        xhr.send(blobFormData);
                    });
                }

                blobUrls.push(blobUrl);
                fileNames.push(file.name);
                done++;
                setUploadProgress(Math.round((done / total) * 90));
            }

            const data = new FormData();
            data.append("blobUrls", JSON.stringify(blobUrls));
            data.append("fileNames", JSON.stringify(fileNames));
            data.append("courseName", formData.courseName);
            data.append("term", formData.term);
            data.append("university", formData.university);
            data.append("faculty", formData.faculty);
            data.append("department", formData.department);
            data.append("description", formData.description);
            data.append("noteType", formData.noteType);
            data.append("price", formData.price.toString());
            data.append("isAI", formData.isAI.toString());

            setUploadProgress(95);

            const res = await fetch("/api/upload", { method: "POST", body: data });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Yükleme başarısız");
            }

            setUploadProgress(100);
            setShowModal(true);
            setFiles([]);
        } catch (error) {
            console.error(error);
            alert("Bir hata oluştu: " + (error as Error).message);
            setUploadProgress(0);
        } finally {
            setLoading(false);
            setTimeout(() => setUploadProgress(0), 2000);
        }
    };

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 text-foreground relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow opacity-20 pointer-events-none" />
                <div className="bg-card/70 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl max-w-lg w-full relative z-10 scale-100 animate-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 bg-gradient-to-br from-primary/20 to-primary/5 text-primary rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-primary/5">
                        <UploadCloud className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black mb-4 tracking-tight">Giriş Yapmalısın</h1>
                    <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                        Notlarını paylaşarak puanlar ve ödüller kazanmak için hemen hesabına giriş yap.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link href="/auth/signin" className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">Giriş Yap</Link>
                        <Link href="/auth/signup" className="w-full py-4 bg-secondary/50 text-foreground font-bold rounded-2xl hover:bg-secondary transition-all active:scale-95">Hesap Oluştur</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 md:pb-12 relative overflow-hidden">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="max-w-3xl mx-auto px-4 md:px-0 pt-8 md:pt-12">
                <div className="text-center mb-10 space-y-2">
                    <div className='inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2 animate-in fade-in slide-in-from-top-4'>
                        <Sparkles className='w-3 h-3' />
                        Ot Yükle & Kazan
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Bilgini Paylaş</h1>
                    <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                        Diğer öğrencilere yardımcı ol, <span className="text-foreground font-bold underline decoration-primary decoration-2 underline-offset-2">puan kazan</span> ve topluluğun en iyisi ol.
                    </p>
                </div>

                <div className="bg-card/70 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                    <div className="mb-6 space-y-4">
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Info className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-foreground">Dikkat Edilmesi Gerekenler</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">Topluluğun faydalanabilmesi için lütfen tüm bilgileri doğru giriniz.</p>
                            </div>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Gift className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-foreground">5 Süt Hediye</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">Her içerik paylaşımınız onaylandığında hesabınıza <span className="font-bold text-foreground">5 Süt/Kredi</span> hediye edilir.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div
                            className={`group border-2 border-dashed rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
                                dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-card/50"
                            } ${files.length ? "bg-primary/5 border-primary/50" : ""}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                onChange={handleChange}
                                accept=".pdf,.png,.jpg,.jpeg"
                            />
                            {files.length > 0 ? (
                                <div className="w-full space-y-4 relative z-10">
                                    <div className="text-center mb-4">
                                        <p className="text-sm font-bold text-foreground">
                                            {files.length} dosya seçildi • {(totalSize / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Daha fazla eklemek için tıklayın veya sürükleyin</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto">
                                        {files.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className="relative group/card bg-background/80 border border-border rounded-xl p-2 overflow-hidden"
                                            >
                                                <div className="aspect-square rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                                                    {item.preview ? (
                                                        <img src={item.preview} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                            <FileText className="w-10 h-10" />
                                                            <span className="text-[10px] uppercase font-mono">PDF</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-1 truncate text-xs font-medium text-foreground" title={item.file.name}>
                                                    {item.file.name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {(item.file.size / 1024).toFixed(1)} KB
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(item.id); }}
                                                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500/90 text-white hover:bg-red-600 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                                    aria-label="Kaldır"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                                    <div className="h-16 w-16 bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                                        <UploadCloud className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Dosyaları Buraya Sürükle</h3>
                                    <p className="text-sm text-muted-foreground mb-4">veya seçmek için tıkla (çoklu seçim)</p>
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-muted-foreground opacity-70">
                                        <span className="px-2 py-1 bg-muted rounded">PDF</span>
                                        <span className="px-2 py-1 bg-muted rounded">JPG</span>
                                        <span className="px-2 py-1 bg-muted rounded">PNG</span>
                                        <span>(MAX 25MB, {MAX_FILES} dosya)</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Ders Adı</label>
                                <input
                                    name="courseName"
                                    value={formData.courseName}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder="Örn: Fizik 101"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Dönem</label>
                                <div className="relative">
                                    <select
                                        name="term"
                                        value={formData.term}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                            <React.Fragment key={year}>
                                                <option value={`${year} Güz`}>{year} Güz</option>
                                                <option value={`${year} Bahar`}>{year} Bahar</option>
                                            </React.Fragment>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Üniversite</label>
                                <div className="relative">
                                    <select
                                        name="university"
                                        value={formData.university}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="">Seçiniz</option>
                                        {universities.map((university) => (
                                            <option key={university.id} value={university.name}>
                                                {university.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Fakülte</label>
                                <div className="relative">
                                    <select
                                        name="faculty"
                                        value={formData.faculty}
                                        onChange={handleFormChange}
                                        required
                                        disabled={!formData.university}
                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                    >
                                        <option value="">Seçiniz</option>
                                        {availableFaculties.map((faculty) => (
                                            <option key={faculty.name} value={faculty.name}>
                                                {faculty.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Bölüm</label>
                                <div className="relative">
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleFormChange}
                                        required
                                        disabled={!formData.faculty}
                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                    >
                                        <option value="">Seçiniz</option>
                                        {availableDepartments.map((department) => (
                                            <option key={department} value={department}>
                                                {department}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end px-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Açıklama</label>
                                <span className="text-[10px] text-muted-foreground font-mono">{formData.description.length}/1000</span>
                            </div>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                rows={4}
                                maxLength={1000}
                                className="w-full bg-background/50 border border-border rounded-xl p-4 text-foreground text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all placeholder:text-muted-foreground/50"
                                placeholder="Not içeriği hakkında ipuçları ver..."
                            />
                        </div>

                        <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50">
                            <label className="text-sm font-bold text-foreground mb-3 block">İçerikte Yapay Zeka (AI) desteği var mı?</label>
                            <div className="flex gap-3">
                                <label className="flex-1 relative cursor-pointer group">
                                    <input type="radio" name="isAI" className="hidden peer" checked={formData.isAI === true} onChange={() => setFormData(prev => ({ ...prev, isAI: true }))} />
                                    <div className="px-4 py-3 rounded-xl border border-transparent bg-background text-muted-foreground text-center text-sm font-medium transition-all peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:border-primary peer-checked:font-bold hover:bg-background/80">Evet (AI Var)</div>
                                </label>
                                <label className="flex-1 relative cursor-pointer group">
                                    <input type="radio" name="isAI" className="hidden peer" checked={formData.isAI === false} onChange={() => setFormData(prev => ({ ...prev, isAI: false }))} />
                                    <div className="px-4 py-3 rounded-xl border border-transparent bg-background text-muted-foreground text-center text-sm font-medium transition-all peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:border-primary peer-checked:font-bold hover:bg-background/80">Hayır (Orijinal)</div>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">İçerik Türü</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Ders Notu', 'Otlak Sorular', 'Ödev', 'Slayt'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, noteType: type }))}
                                        className={`px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                                            formData.noteType === type ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Satış Fiyatı (Süt/Kredi)</label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, price: n }))}
                                        className={`flex-1 min-w-[60px] px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                                            formData.price === n ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                        }`}
                                    >
                                        {n} Süt
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            {loading && uploadProgress > 0 && (
                                <div className="mb-4 space-y-2">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span>Yükleniyor...</span>
                                        <span className="font-bold text-primary">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300 ease-out rounded-full" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full py-6 text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                                disabled={loading || !files.length}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                                        <span className="w-2 h-2 rounded-full bg-white animate-bounce delay-100" />
                                        <span className="w-2 h-2 rounded-full bg-white animate-bounce delay-200" />
                                        {uploadProgress > 0 ? `Yükleniyor... ${uploadProgress}%` : "Yükleniyor..."}
                                    </span>
                                ) : "Onaya Gönder 🚀"}
                            </Button>
                            <p className="text-center text-[10px] text-muted-foreground mt-4 px-4 leading-relaxed opacity-60">
                                &quot;Onaya Gönder&quot; butonuna tıklayarak Topluluk Kurallarını, Telif Hakkı Politikasını ve Kullanıcı Sözleşmesini kabul etmiş olursunuz.
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card border border-primary/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                        <div className="h-20 w-20 bg-gradient-to-br from-Emerald-400 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30 animate-bounce-slow">
                            <CheckCircle className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground mb-2 tracking-tight">Harika! 🎉</h2>
                        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                            Notun moderatörlerimiz tarafından incelenmek üzere alındı. <span className="font-bold text-foreground">24 saat içinde</span> onaylanarak yayına alınacaktır.
                        </p>
                        <Link href="/">
                            <Button className="w-full py-4 text-base font-bold shadow-lg shadow-primary/20">Ana Sayfaya Dön</Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
