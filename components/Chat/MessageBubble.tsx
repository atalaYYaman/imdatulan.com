'use client';

import { cn } from "@/lib/utils";
import { User, Trash2 } from "lucide-react";
import { ChatMessageDto } from "@/app/actions/chatActions";

interface MessageBubbleProps {
    message: ChatMessageDto;
    isCurrentUser: boolean;
    isAdmin?: boolean;
    replyToMessage?: ChatMessageDto; // The message being replied to (if any)
    onReply: (message: ChatMessageDto) => void;
    onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, isCurrentUser, isAdmin, replyToMessage, onReply, onDelete }: MessageBubbleProps) {
    return (
        <div className={cn("flex gap-3 max-w-[85%]", isCurrentUser ? "ml-auto flex-row-reverse" : "")}>
            {/* Avatar */}
            <div className="flex-shrink-0">
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border border-border shadow-sm",
                    isCurrentUser ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                    <User className="h-4 w-4" />
                </div>
            </div>

            {/* Content Body */}
            <div className={cn(
                "flex flex-col gap-1 min-w-[120px]",
                isCurrentUser ? "items-end" : "items-start"
            )}>
                {/* Header: Name & Time */}
                <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold text-muted-foreground opacity-70">
                        {message.user.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50" suppressHydrationWarning>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Bubble */}
                <div className={cn(
                    "relative group px-4 py-2 rounded-2xl text-sm shadow-sm border border-border/50",
                    isCurrentUser
                        ? "bg-primary/10 text-foreground rounded-tr-sm"
                        : "bg-card text-foreground rounded-tl-sm"
                )}>
                    {/* Quote / Reply Context */}
                    {replyToMessage && (
                        <div className="mb-2 pl-2 border-l-2 border-primary/30 bg-background/50 rounded-r p-1 text-xs text-muted-foreground opacity-80 cursor-pointer hover:opacity-100 transition-opacity">
                            <div className="font-bold text-[10px] mb-0.5">{replyToMessage.user.name}</div>
                            <div className="line-clamp-1 italic">{replyToMessage.content}</div>
                        </div>
                    )}

                    {/* Main Content */}
                    <p className="leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                    </p>

                    {/* Actions (Reply - Visible on Hover) */}
                    <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
                        isCurrentUser ? "-left-16" : "-right-16"
                    )}>
                        <button
                            onClick={() => onReply(message)}
                            className="p-1.5 rounded-full hover:bg-background/80 text-muted-foreground hover:text-primary transition-colors"
                            title="Yanıtla"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-reply"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                        </button>

                        {isAdmin && onDelete && (
                            <button
                                onClick={() => onDelete(message.id)}
                                className="p-1.5 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Sil (Admin)"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
