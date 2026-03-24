'use client';

import { Eye, Share2, AlertTriangle, Trash2, GraduationCap } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { deleteNote, submitNoteGrade } from '@/app/actions/noteActions';
import { useRouter } from 'next/navigation';
import type { NoteLetterGrade } from '@prisma/client';
import {
    NOTE_LETTER_GRADES,
    tierForGrade,
    formatRatingSummary,
    unratedMessage,
} from '@/lib/noteGrades';

function tierChipClasses(tier: ReturnType<typeof tierForGrade>): string {
    switch (tier) {
        case 'positiveGreen':
            return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
        case 'warmYellow':
            return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/25';
        default:
            return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25';
    }
}

function gradeButtonClasses(
    grade: NoteLetterGrade,
    selected: boolean
): string {
    const tier = tierForGrade(grade);
    const base = 'px-2 py-1 rounded-lg text-[10px] font-black border transition-all active:scale-95';
    const tierStyle =
        tier === 'positiveGreen'
            ? 'border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10'
            : tier === 'warmYellow'
              ? 'border-amber-500/30 text-amber-900 dark:text-amber-300 hover:bg-amber-500/10'
              : 'border-rose-500/30 text-rose-800 dark:text-rose-300 hover:bg-rose-500/10';
    const sel = selected
        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
        : 'bg-secondary/50 opacity-90 hover:opacity-100';
    return `${base} ${tierStyle} ${sel}`;
}

interface RatingSummary {
    count: number;
    averageScore: number | null;
    letter: NoteLetterGrade | null;
}

interface InteractionBarProps {
    noteId: string;
    rating: RatingSummary;
    initialMyGrade: NoteLetterGrade | null;
    viewCount: number;
    isOwner: boolean;
    canRate: boolean;
    onReport: () => void;
}

export default function InteractionBar({
    noteId,
    rating,
    initialMyGrade,
    viewCount,
    isOwner,
    canRate,
    onReport,
}: InteractionBarProps) {
    const [myGrade, setMyGrade] = useState(initialMyGrade);
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMyGrade(initialMyGrade);
    }, [initialMyGrade]);

    const handleGrade = (grade: NoteLetterGrade) => {
        setMyGrade(grade);
        startTransition(async () => {
            const res = await submitNoteGrade(noteId, grade);
            if (!res.success) {
                setMyGrade(initialMyGrade);
                alert(res.message || 'Kaydedilemedi');
                return;
            }
            router.refresh();
        });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        const toast = document.createElement('div');
        toast.innerHTML = `<div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>Link Kopyalandı!</span></div>`;
        toast.className =
            'fixed bottom-8 left-1/2 -translate-x-1/2 bg-foreground/90 backdrop-blur-md text-background px-4 py-3 rounded-2xl text-sm font-bold shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2 border border-white/10';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    };

    const handleDelete = async () => {
        if (!confirm('Bu içeriği silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'))
            return;

        setIsDeleting(true);
        try {
            const result = await deleteNote(noteId);
            if (result?.success) {
                router.push('/profile?tab=notes');
            } else {
                alert('Silme işlemi başarısız oldu.');
            }
        } catch (e) {
            console.error(e);
            alert('Bir hata oluştu.');
        } finally {
            setIsDeleting(false);
        }
    };

    const showRated =
        rating.count > 0 &&
        rating.averageScore != null &&
        rating.letter != null;

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
                <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                        showRated
                            ? tierChipClasses(tierForGrade(rating.letter!))
                            : 'bg-muted/40 text-muted-foreground border-border/60'
                    }`}
                >
                    <GraduationCap className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    {!showRated ? (
                        <span className="italic font-semibold">{unratedMessage()}</span>
                    ) : (
                        <span>
                            {formatRatingSummary(
                                rating.averageScore!,
                                rating.letter!
                            )}{' '}
                            <span className="opacity-75 font-mono">
                                ({rating.count} oy)
                            </span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground bg-secondary/50 rounded-xl border border-transparent hover:border-border transition-colors">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono">{viewCount}</span>
                </div>
            </div>

            {canRate && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Harf notun
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {NOTE_LETTER_GRADES.map((g) => (
                            <button
                                key={g}
                                type="button"
                                disabled={isPending}
                                onClick={() => handleGrade(g)}
                                className={gradeButtonClasses(g, myGrade === g)}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isOwner && (
                <p className="text-[10px] text-muted-foreground">
                    Kendi notunuza harf notu veremezsiniz.
                </p>
            )}

            {!isOwner && !canRate && (
                <p className="text-[10px] text-muted-foreground">
                    Değerlendirmek için notu satın almalısınız.
                </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                <button
                    type="button"
                    onClick={handleShare}
                    className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95"
                    title="Bağlantıyı Kopyala"
                >
                    <Share2 className="w-5 h-5" />
                </button>

                <button
                    type="button"
                    onClick={onReport}
                    className="p-2.5 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-all active:scale-95"
                    title="Şikayet Et"
                >
                    <AlertTriangle className="w-5 h-5" />
                </button>

                {isOwner && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
                        title="İçeriği Sil"
                    >
                        {isDeleting ? (
                            <span className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
                        ) : (
                            <Trash2 className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
