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
        <div className="flex flex-col h-full bg-background border-t md:border-t-0 border-border/50">
            {/* Header */}
            <div className="p-4 bg-muted/30 border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">{(initialComments.length)}</span>
                    Yorumlar
                </h3>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {initialComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 text-sm gap-2 opacity-70">
                        <User className="w-8 h-8 opacity-50" />
                        <p>Henüz yorum yapılmamış.</p>
                        <p className="text-xs">İlk yorumu sen yap!</p>
                    </div>
                ) : (
                    initialComments.map((comment) => (
                        <div key={comment.id} className="group animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold ring-2 ring-background text-primary">
                                    {comment.user.firstName?.[0] || <User className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 bg-muted/30 p-3 rounded-xl rounded-tl-none border border-border/50">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-sm font-bold text-foreground">
                                            {comment.user.firstName} {comment.user.lastName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed break-words">
                                        {comment.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Comment Form */}
            <div className="p-3 bg-background border-t border-border/50">
                <form ref={formRef} onSubmit={handleSubmit} className="relative group">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Yorum yap..."
                        disabled={isPending}
                        className="w-full bg-muted/50 text-sm text-foreground placeholder-muted-foreground border border-border/50 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || isPending}
                        className="absolute right-2 top-2 p-1.5 text-primary disabled:text-muted-foreground disabled:opacity-50 hover:bg-primary/10 rounded-lg transition-colors active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
