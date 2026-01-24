'use client';

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessageDto } from "@/app/actions/chatActions";

interface ChatInputProps {
    onSend: (content: string, replyToId?: string) => void;
    replyTo?: ChatMessageDto | null;
    onCancelReply: () => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, replyTo, onCancelReply, disabled }: ChatInputProps) {
    const [content, setContent] = useState("");
    const maxChars = 280;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim() || disabled) return;

        onSend(content, replyTo?.id);
        setContent("");
        onCancelReply(); // Clear reply after sending
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [content]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="p-4 bg-card/80 backdrop-blur-md border-t border-border">
            {/* Reply Badge */}
            {replyTo && (
                <div className="flex items-center justify-between bg-muted/50 border-l-2 border-primary px-3 py-2 rounded-r-lg mb-2 text-xs text-muted-foreground animate-in slide-in-from-bottom-2 fade-in">
                    <div className="flex flex-col">
                        <span className="font-bold text-primary">@{replyTo.user.name}</span>
                        <span className="line-clamp-1 italic text-[10px]">{replyTo.content}</span>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-background rounded-full transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2 relative">
                <div className="relative flex-1">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder="Bir şeyler yaz..."
                        rows={1}
                        className="w-full bg-muted/40 border-border focus:border-primary/50 focus:ring-1 focus:ring-primary rounded-2xl px-4 py-3 pr-12 text-sm resize-none outline-none scrollbar-thin transition-all max-h-[120px]"
                    />
                    {/* Char Counter Ring */}
                    <div className="absolute bottom-3 right-3">
                        <CircularProgress value={content.length} max={maxChars} />
                    </div>
                </div>

                <button
                    onClick={() => handleSubmit()}
                    disabled={!content.trim() || disabled}
                    className="h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all mb-0.5"
                >
                    <Send className="h-4 w-4 ml-0.5" />
                </button>
            </div>
        </div>
    );
}

function CircularProgress({ value, max }: { value: number, max: number }) {
    const radius = 8;
    const circumference = 2 * Math.PI * radius;
    const percentage = (value / max) * 100;
    const dashoffset = circumference - (percentage / 100) * circumference;

    // Color logic
    const color = percentage > 90 ? "text-rose-500" : percentage > 75 ? "text-orange-500" : "text-primary/40";

    return (
        <div className="relative flex items-center justify-center">
            <svg className="transform -rotate-90 w-6 h-6">
                <circle
                    className="text-muted"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="12"
                    cy="12"
                />
                <circle
                    className={cn("transition-all duration-300", color)}
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="12"
                    cy="12"
                />
            </svg>
            <span className={cn("text-[8px] absolute font-bold", percentage > 90 ? "text-rose-500" : "text-muted-foreground")}>
                {max - value <= 20 ? max - value : ''}
            </span>
        </div>
    );
}
