'use client';

import { useState } from 'react';
// import { approveNote, rejectNote } from '@/app/actions/adminActions'; // Deprecated in favor of API routes
import { FileText, Download, User, Check, X, Loader2, School, BookOpen, AlertCircle } from 'lucide-react';

type NoteData = {
    id: string;
    title: string;
    description: string | null;
    firstName?: string; // Mapped from uploader manually if needed? No, include uploader object
    uploader: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
    fileUrl: string;
    price: number;
    university: string;
    faculty: string;
    department: string;
    courseName?: string | null;
    createdAt: Date;
};

export default function NoteApprovalList({ notes }: { notes: NoteData[] }) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleApprove = async (noteId: string) => {
        if (!confirm('Notu onaylamak istediğinize emin misiniz?')) return;
        setActionLoading(noteId);

        try {
            const res = await fetch('/api/admin/notes/approve', {
                method: 'POST',
                body: JSON.stringify({ noteId }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error('Onay işlemi başarısız');

            alert('Not onaylandı ve kullanıcıya 3 Süt yüklendi.');
            window.location.reload(); // Refresh to update list
        } catch (error) {
            console.error(error);
            alert('Bir hata oluştu.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (noteId: string) => {
        const reason = prompt('Reddetme sebebi?');
        if (!reason) return;

        setActionLoading(noteId);
        try {
            const res = await fetch('/api/admin/notes/reject', {
                method: 'POST',
                body: JSON.stringify({ noteId, reason }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error('Reddetme işlemi başarısız');

            alert('Not reddedildi ve kullanıcı bilgilendirildi.');
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Bir hata oluştu.');
        } finally {
            setActionLoading(null);
        }
    };

    if (notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">Başvuru Yok</h3>
                <p className="text-muted-foreground">Şu an bekleyen not başvurusu bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {notes.map(note => (
                <div key={note.id} className="bg-card/60 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Info */}
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider border border-primary/20">
                                            Ders Notu
                                        </span>
                                        <span className="text-xs text-muted-foreground">• {new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-foreground">{note.title}</h3>
                                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                                        {note.description || <span className="italic opacity-50">Açıklama yok</span>}
                                    </p>
                                </div>

                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    <div className="bg-cyan-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/20">
                                        {note.price} Süt
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Yükleyen</div>
                                        <div className="text-sm font-bold truncate">{note.uploader.firstName} {note.uploader.lastName}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Ders</div>
                                        <div className="text-sm font-bold truncate">{note.courseName || '-'}</div>
                                    </div>
                                </div>

                                <div className="col-span-1 sm:col-span-2 flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                        <School className="w-4 h-4" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Okul / Bölüm</div>
                                        <div className="text-sm font-bold truncate">{note.university} <span className="opacity-50">/</span> {note.department}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex flex-row md:flex-col justify-between gap-3 md:w-48 shrink-0">
                            <a
                                href={note.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 w-full py-3 bg-background border border-border hover:border-primary/50 text-foreground rounded-xl font-bold transition-all hover:shadow-lg group/btn"
                            >
                                <FileText className="w-4 h-4 group-hover/btn:scale-110 transition-transform text-primary" />
                                Önizle
                            </a>

                            <div className="h-px bg-border w-full hidden md:block" />

                            <div className="flex flex-col gap-2 w-full">
                                <button
                                    onClick={() => handleApprove(note.id)}
                                    disabled={!!actionLoading}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === note.id ? <Loader2 className="animate-spin w-4 h-4" /> : <><Check className="w-4 h-4" /> Onayla</>}
                                </button>
                                <button
                                    onClick={() => handleReject(note.id)}
                                    disabled={!!actionLoading}
                                    className="w-full py-3 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl font-bold border border-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <X className="w-4 h-4" /> Reddet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
