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
        rating: number;
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
            <div className="bg-[#002A30] border border-[#003E44] rounded-xl overflow-hidden hover:border-[#22d3ee]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] group-hover:-translate-y-1">
                <div className="p-4 flex gap-4">
                    {/* Icon Section */}
                    <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-[#075985]/30 flex items-center justify-center border border-[#075985]">
                            <FileText className="h-6 w-6 text-[#22d3ee]" />
                        </div>
                        <div className="mt-2 text-[10px] text-center text-gray-400 font-medium bg-black/20 rounded py-0.5">
                            {note.type.split(' ')[0]}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-base mb-1 truncate group-hover:text-[#22d3ee] transition-colors">{note.title}</h3>
                        <div className="text-xs text-gray-400 space-y-0.5">
                            <p className="truncate">{note.university}</p>
                            <p className="truncate text-gray-500">{note.department}</p>
                            {note.instructor && <p className="text-[#22d3ee]/80 truncate">{note.instructor}</p>}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="bg-[#002228] px-4 py-3 border-t border-[#003E44] flex items-center justify-between">
                    {/* Author Info */}
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gray-700 overflow-hidden">
                            {author.avatar ? (
                                <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-4 w-4 m-1 text-gray-400" />
                            )}
                        </div>
                        <span className="text-xs text-gray-300 font-medium truncate max-w-[80px]">{author.name}</span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 bg-[#22d3ee]/10 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 text-[#22d3ee] fill-[#22d3ee]" />
                        <span className="text-xs font-bold text-[#22d3ee]">{note.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
