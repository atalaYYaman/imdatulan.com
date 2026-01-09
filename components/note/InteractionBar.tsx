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
        // Simple toast feedback
        const toast = document.createElement("div");
        toast.innerText = "Link Kopyalandı! 🔗";
        toast.className = "fixed bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-bold z-[100] animate-in fade-in slide-in-from-bottom-2";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
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
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={handleLike}
                    disabled={isPending}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isLiked
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-bold">{likeCount}</span>
                </button>

                <div className="flex items-center gap-2 px-3 py-2 text-gray-400 bg-white/5 rounded-xl">
                    <Eye className="w-5 h-5" />
                    <span className="text-sm">{viewCount}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-[#22d3ee] hover:bg-[#22d3ee]/10 rounded-xl transition-colors"
                    title="Bağlantıyı Kopyala"
                >
                    <Share2 className="w-5 h-5" />
                </button>

                <button
                    onClick={onReport}
                    className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-colors"
                    title="Şikayet Et"
                >
                    <AlertTriangle className="w-5 h-5" />
                </button>

                {isOwner && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="İçeriği Sil"
                    >
                        {isDeleting ? <span className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span> : <Trash2 className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
}
