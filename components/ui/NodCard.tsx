'use client';

import { FileText, Star, User } from 'lucide-react';
import Image from 'next/image';

interface NodCardProps {
    note: {
        id: string;
        title: string;
        university: string;
        department: string;
        instructor?: string;
        fileUrl: string;
        price: number;
        type: string;
    };
    author: {
        name: string;
        avatar?: string;
    };
}

export function NodCard({ note, author }: NodCardProps) {
    return (
        <div className="group relative h-full">
            {/* Hover Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-emerald-500/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

            <div className="relative h-full bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col shadow-sm group-hover:shadow-xl dark:group-hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]">

                {/* Visual Header / Type Indicator */}
                <div className="h-2 bg-gradient-to-r from-primary to-emerald-500 opacity-80" />

                <div className="p-5 flex flex-col flex-1 gap-4">
                    <div className="flex items-start justify-between gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        {/* Type Badge */}
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                            {note.type ? note.type.split(' ')[0] : 'NOT'}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                        <h3 className="line-clamp-2 text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                            {note.title}
                        </h3>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground line-clamp-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                                {note.university}
                            </p>
                            <p className="text-xs text-muted-foreground/80 line-clamp-1 pl-2.5">
                                {note.department}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto border-t border-border/50 bg-muted/20 px-5 py-3 flex items-center justify-between">
                    {/* Author */}
                    <div className="flex items-center gap-2 max-w-[60%]">
                        <div className="h-6 w-6 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0">
                            {author.avatar ? (
                                <Image src={author.avatar} alt={author.name} width={24} height={24} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-secondary">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground truncate">{author.name}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/10">
                        <span className="text-xs font-bold text-primary">{note.price}</span>
                        <span className="text-sm leading-none">🥛</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
