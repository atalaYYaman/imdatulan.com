'use client';

import { Heart, Eye, Share2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toggleLike } from '@/app/actions/noteActions';

interface InteractionBarProps {
    noteId: string;
    initialLikeCount: number;
    initialIsLiked: boolean;
    viewCount: number;
}

export default function InteractionBar({ noteId, initialLikeCount, initialIsLiked, viewCount }: InteractionBarProps) {
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isPending, startTransition] = useTransition();

    const handleLike = () => {
        // Optimistic update
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

        startTransition(async () => {
            await toggleLike(noteId);
        });
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Otlak Notu',
                text: 'Bu notu incelemelisin!',
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link kopyalandı!');
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

            <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-[#22d3ee] hover:bg-[#22d3ee]/10 rounded-xl transition-colors"
                title="Paylaş"
            >
                <Share2 className="w-5 h-5" />
            </button>
        </div>
    );
}
