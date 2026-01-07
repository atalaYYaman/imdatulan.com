'use client';

import { useState, useTransition, useRef } from 'react';
import { Send, User } from 'lucide-react';
import { addComment } from '@/app/actions/noteActions';
import { Comment } from '@prisma/client';

type CommentWithUser = Comment & {
    user: {
        firstName: string | null;
        lastName: string | null;
    };
};

interface CommentSectionProps {
    noteId: string;
    initialComments: CommentWithUser[];
}

export default function CommentSection({ noteId, initialComments }: CommentSectionProps) {
    const [text, setText] = useState("");
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        startTransition(async () => {
            await addComment(noteId, text);
            setText("");
            formRef.current?.reset();
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#001E24]">
            {/* Header */}
            <div className="p-4 bg-[#002A30] border-b border-[#003E44]">
                <h3 className="text-sm font-bold text-gray-200">Yorumlar ({initialComments.length})</h3>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {initialComments.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 text-sm">
                        Henüz yorum yapılmamış. İlk yorumu sen yap!
                    </div>
                ) : (
                    initialComments.map((comment) => (
                        <div key={comment.id} className="group">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#075985] flex items-center justify-center flex-shrink-0 text-xs font-bold ring-2 ring-[#003E44]">
                                    {comment.user.firstName?.[0] || <User className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#22d3ee]">
                                            {comment.user.firstName} {comment.user.lastName}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                                        {comment.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Comment Form */}
            <div className="p-3 bg-[#002A30] border-t border-[#003E44]">
                <form ref={formRef} onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Yorum yap..."
                        disabled={isPending}
                        className="w-full bg-[#001E24] text-sm text-white placeholder-gray-500 border border-[#003E44] rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-[#22d3ee] transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || isPending}
                        className="absolute right-2 top-2 p-1.5 text-[#22d3ee] disabled:text-gray-600 hover:bg-[#22d3ee]/10 rounded-lg transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
