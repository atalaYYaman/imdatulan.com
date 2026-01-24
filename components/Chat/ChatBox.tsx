'use client';

import { useState, useRef, useEffect, useOptimistic, startTransition } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatMessageDto, sendMessage } from "@/app/actions/chatActions";
import Link from "next/link";
import { Lock } from "lucide-react";

interface ChatBoxProps {
    initialMessages: ChatMessageDto[];
    currentUser?: {
        id: string;
        name: string;
    } | null;
}

export default function ChatBox({ initialMessages, currentUser }: ChatBoxProps) {
    const [replyTo, setReplyTo] = useState<ChatMessageDto | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Optimistic Logic
    const [messages, addOptimisticMessage] = useOptimistic(
        initialMessages,
        (state: ChatMessageDto[], newMessage: ChatMessageDto) => [
            ...state,
            newMessage
        ]
    );

    const isGuest = !currentUser;

    // Auto-scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = async (content: string, replyToId?: string) => {
        // Optimistic Update
        const optimisticMsg: ChatMessageDto = {
            id: crypto.randomUUID(), // Temp ID
            content,
            createdAt: new Date(),
            parentId: replyToId,
            user: {
                id: currentUser?.id || 'temp',
                name: currentUser?.name || 'Ben',
            }
        };

        startTransition(() => {
            addOptimisticMessage(optimisticMsg);
        });

        // Server Action
        await sendMessage(content, replyToId);
        // We rely on revalidatePath in action to fetch real data next render
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-md mx-auto bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden relative">

            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between absolute top-0 left-0 right-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <h3 className="font-bold text-sm tracking-wide">Genel Sohbet</h3>
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Canlı</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto pt-16 pb-4 px-4 space-y-4 scroll-smooth scrollbar-none" ref={scrollRef}>

                {/* Guest Wall Overlay - If Guest, appear at top of list logic */}
                {isGuest && (
                    <div className="sticky top-0 z-20 -mx-4 px-4 pb-10 bg-gradient-to-b from-card via-card/90 to-transparent pt-4 flex flex-col items-center text-center gap-3 mb-4 backdrop-blur-[2px]">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Lock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Sohbete Katıl</p>
                            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                Tüm mesajları görmek ve yazmak için giriş yapmalısın.
                            </p>
                        </div>
                        <Link href="/auth/signin" className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                            Giriş Yap
                        </Link>
                    </div>
                )}

                {/* Empty State */}
                {!isGuest && messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                        <span className="text-4xl">💭</span>
                        <p className="text-sm">Henüz mesaj yok. İlk yazan sen ol!</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        isCurrentUser={currentUser?.id === msg.user.id}
                        replyToMessage={messages.find(m => m.id === msg.parentId)}
                        onReply={(m) => !isGuest && setReplyTo(m)}
                    />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <ChatInput
                onSend={handleSend}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                disabled={isGuest}
            />
        </div>
    );
}
