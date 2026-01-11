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
    purchasedNotes?: any[];
    stats: {
        totalLikes: number;
        totalViews: number;
        totalNotes: number;
    };
}

export default function ProfileView({ user, notes, purchasedNotes = [], stats }: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState<'shared' | 'viewed' | 'favorites'>('shared');

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="bg-card border border-border rounded-2xl p-6 md:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Trophy className="h-48 w-48 text-primary rotate-12" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                        {/* Avatar */}
                        <div className="h-32 w-32 rounded-full border-4 border-primary p-1 bg-background">
                            <div className="h-full w-full rounded-full bg-muted flex items-center justify-center">
                                <User className="h-12 w-12 text-muted-foreground" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                                    {user.role === 'ADMIN' ? 'Yönetici' : 'Öğrenci'}
                                </span>
                            </div>
                            <p className="text-muted-foreground">{user.university} • {user.department}</p>
                            <p className="text-muted-foreground text-sm">{user.faculty}</p>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                                <div className="text-center md:text-left md:border-r border-border pr-0 md:pr-6">
                                    <div className="text-2xl font-bold text-primary">{stats.totalLikes}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Toplam Beğeni</div>
                                </div>
                                <div className="text-center md:text-left md:border-r border-border pr-0 md:pr-6">
                                    <div className="text-2xl font-bold text-primary">{stats.totalViews}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Görüntülenme</div>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="text-2xl font-bold text-primary">{stats.totalNotes}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Paylaşılan Not</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div>
                    <div className="flex border-b border-border mb-6 overflow-x-auto gap-4">
                        <button
                            onClick={() => setActiveTab('shared')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'shared' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <FileText className="h-4 w-4" /> Paylaşılan Notlar
                        </button>
                        <button
                            onClick={() => setActiveTab('viewed')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'viewed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Trophy className="h-4 w-4" /> Satın Aldıklarım
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* SHARED NOTES */}
                        {activeTab === 'shared' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {notes.map(note => (
                                    <Link key={note.id} href={`/notes/${note.id}`} className="block transition-transform hover:scale-105 relative group">
                                        <NodCard note={note} author={{ name: user.name, avatar: '', stats: { rating: 5.0, totalNotes: 0 } } as any} />

                                        {/* Status Indicators */}
                                        {note.status === 'PENDING' && (
                                            <div className="absolute inset-x-0 bottom-0 bg-orange-500/90 text-white text-xs font-bold text-center py-2 backdrop-blur-sm rounded-b-xl z-20">
                                                Onay Bekliyor ⏳
                                            </div>
                                        )}
                                        {note.status === 'REJECTED' && (
                                            <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-xs font-bold text-center py-2 backdrop-blur-sm rounded-b-xl z-20">
                                                Reddedildi ❌
                                            </div>
                                        )}
                                        {note.status === 'SUSPENDED' && (
                                            <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
                                                <div className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                                    🚫 Askıya Alındı
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                ))}

                                {/* Add New Card Mock */}
                                <Link href="/upload" className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all min-h-[200px] group">
                                    <div className="h-12 w-12 rounded-full bg-card flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <div className="text-2xl">+</div>
                                    </div>
                                    <span className="font-medium">Yeni Ot Yükle</span>
                                </Link>
                            </div>
                        )}

                        {/* PURCHASED NOTES */}
                        {activeTab === 'viewed' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {notes.length === 0 && purchasedNotes.length === 0 /* Just a check, actually purchasedNotes logic below */}

                                {purchasedNotes.length > 0 ? (
                                    purchasedNotes.map((note: any) => {
                                        const authorName = note.uploader ? `${note.uploader.firstName || ''} ${note.uploader.lastName || ''}`.trim() : 'Bilinmiyor';
                                        return (
                                            <Link key={note.id} href={`/notes/${note.id}`} className="block transition-transform hover:scale-105 relative group">
                                                <NodCard note={note} author={{ name: authorName, avatar: '', stats: { rating: 5.0, totalNotes: 0 } } as any} />
                                                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                                    SATIN ALINDI
                                                </div>
                                            </Link>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl">
                                        Henüz hiç not satın almamışsınız. 🐄
                                        <Link href="/" className="block mt-2 text-primary hover:underline">Markete Git</Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
