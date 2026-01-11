'use client';

import { Heart, Eye, Share2, AlertTriangle, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toggleLike, deleteNote } from '@/app/actions/noteActions';
import { useRouter } from 'next/navigation';

interface InteractionBarProps {
    noteId: string;
    initialLikeCount: number;
    initialIsLiked: boolean;
    viewCount: number;
    isOwner: boolean;
    onReport: () => void;
}

export default function InteractionBar({ noteId, initialLikeCount, initialIsLiked, viewCount, isOwner, onReport }: InteractionBarProps) {
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleLike = () => {
        // Optimistic update
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

        startTransition(async () => {
            await toggleLike(noteId);
        });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        // Look mom, no toast library! Native DOM is fine for MVP but lets make it pretty.
        const toast = document.createElement("div");
        toast.innerHTML = `<div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>Link Kopyalandı!</span></div>`;
        toast.className = "fixed bottom-8 left-1/2 -translate-x-1/2 bg-foreground/90 backdrop-blur-md text-background px-4 py-3 rounded-2xl text-sm font-bold shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2 border border-white/10";
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    };

    const handleDelete = async () => {
        if (!confirm("Bu içeriği silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;

        setIsDeleting(true);
        try {
            const result = await deleteNote(noteId);
            if (result?.success) {
                router.push('/profile?tab=notes');
            } else {
                alert("Silme işlemi başarısız oldu.");
            }
        } catch (e) {
            console.error(e);
            alert("Bir hata oluştu.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
                <button
                    onClick={handleLike}
                    disabled={isPending}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95 ${isLiked
                        ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                >
                    <Heart className={`w-5 h-5 transition-transform group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-bold text-sm">{likeCount}</span>
                </button>

                <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground bg-secondary/50 rounded-xl border border-transparent hover:border-border transition-colors">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono">{viewCount}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleShare}
                    className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95"
                    title="Bağlantıyı Kopyala"
                >
                    <Share2 className="w-5 h-5" />
                </button>

                <button
                    onClick={onReport}
                    className="p-2.5 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-all active:scale-95"
                    title="Şikayet Et"
                >
                    <AlertTriangle className="w-5 h-5" />
                </button>

                {isOwner && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
                        title="İçeriği Sil"
                    >
                        {isDeleting ? <span className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span> : <Trash2 className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
}
