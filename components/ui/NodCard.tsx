'use client';

import { FileText, Star, User } from 'lucide-react';
import Link from 'next/link';

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
        <div className="group block cursor-pointer">
            <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] group-hover:-translate-y-1">
                <div className="p-4 flex gap-4">
                    {/* Icon Section */}
                    <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="mt-2 text-[10px] text-center text-muted-foreground font-medium bg-secondary/50 rounded py-0.5">
                            {note.type ? note.type.split(' ')[0] : 'Not'}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-foreground font-semibold text-base mb-1 truncate group-hover:text-primary transition-colors">{note.title}</h3>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                            <p className="truncate">{note.university}</p>
                            <p className="truncate text-muted-foreground/80">{note.department}</p>
                            {note.instructor && <p className="text-primary/80 truncate">{note.instructor}</p>}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="bg-muted/30 px-4 py-3 border-t border-border flex items-center justify-between">
                    {/* Author Info */}
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted overflow-hidden">
                            {author.avatar ? (
                                <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-4 w-4 m-1 text-muted-foreground" />
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium truncate max-w-[80px]">{author.name}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                        <span className="text-xs font-bold text-primary">{note.price} Süt</span>
                        <span className="text-xs">🥛</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
