'use client';

import Link from "next/link";
import { User, Trophy, FileText } from "lucide-react";
import { NodCard } from "@/components/ui/NodCard";
import { useState } from "react";

interface ProfileViewProps {
    user: {
        id: string;
        name: string;
        university: string;
        faculty: string;
        department: string;
        role: string;
    };
    notes: any[];
    stats: {
        totalLikes: number;
        totalViews: number;
        totalNotes: number;
    };
}

export default function ProfileView({ user, notes, stats }: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState<'shared' | 'viewed' | 'favorites'>('shared');

    return (
        <div className="min-h-screen bg-[#01353D] text-white p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="bg-[#002A30] border border-[#003E44] rounded-2xl p-6 md:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Trophy className="h-48 w-48 text-[#22d3ee] rotate-12" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                        {/* Avatar */}
                        <div className="h-32 w-32 rounded-full border-4 border-[#22d3ee] p-1 bg-[#01353D]">
                            <div className="h-full w-full rounded-full bg-gray-700 flex items-center justify-center">
                                <User className="h-12 w-12 text-gray-400" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                                <span className="px-3 py-1 bg-[#22d3ee] text-[#002A30] text-xs font-bold rounded-full uppercase tracking-wider">
                                    {user.role === 'ADMIN' ? 'Yönetici' : 'Öğrenci'}
                                </span>
                            </div>
                            <p className="text-gray-400">{user.university} • {user.department}</p>
                            <p className="text-gray-500 text-sm">{user.faculty}</p>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                                <div className="text-center md:text-left md:border-r border-gray-700 pr-0 md:pr-6">
                                    <div className="text-2xl font-bold text-[#22d3ee]">{stats.totalLikes}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wide">Toplam Beğeni</div>
                                </div>
                                <div className="text-center md:text-left md:border-r border-gray-700 pr-0 md:pr-6">
                                    <div className="text-2xl font-bold text-[#22d3ee]">{stats.totalViews}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wide">Görüntülenme</div>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="text-2xl font-bold text-[#22d3ee]">{stats.totalNotes}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wide">Paylaşılan Not</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div>
                    <div className="flex border-b border-[#003E44] mb-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('shared')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'shared' ? 'border-[#22d3ee] text-[#22d3ee]' : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            <FileText className="h-4 w-4" /> Paylaşılan Notlar
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {activeTab === 'shared' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {notes.map(note => (
                                    <Link key={note.id} href={`/notes/${note.id}`} className="block transition-transform hover:scale-105">
                                        <NodCard note={note} author={{ name: user.name, avatar: '', stats: { rating: 5.0, totalNotes: 0 } } as any} />
                                    </Link>
                                ))}

                                {/* Add New Card Mock */}
                                <Link href="/upload" className="border-2 border-dashed border-[#003E44] rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-[#22d3ee] hover:text-[#22d3ee] hover:bg-[#22d3ee]/5 transition-all min-h-[200px] group">
                                    <div className="h-12 w-12 rounded-full bg-[#002A30] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <div className="text-2xl">+</div>
                                    </div>
                                    <span className="font-medium">Yeni Not Yükle</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
