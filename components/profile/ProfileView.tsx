'use client';

import Link from "next/link";
import { User, Trophy, FileText, Settings, Sparkles } from "lucide-react";
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
    const [activeTab, setActiveTab] = useState<'shared' | 'viewed'>('shared');

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 md:pb-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse-slow opacity-20" />
                <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] animate-pulse-slow delay-1000 opacity-20" />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-8">

                {/* Header Section */}
                <div className="relative overflow-hidden bg-card/60 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
                    {/* Decorative Elements */}
                    <div className="absolute -top-12 -right-12 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 rotate-12">
                        <Trophy className="h-64 w-64 text-foreground" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-emerald-500 rounded-full blur opacity-50 group-hover/avatar:opacity-100 transition duration-500" />
                            <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden">
                                <User className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <div className="absolute bottom-1 right-1 bg-background p-1.5 rounded-full border border-border">
                                <Sparkles className="h-4 w-4 text-primary fill-primary" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="space-y-1">
                                <div className="flex flex-col md:flex-row items-center gap-3">
                                    <h1 className="text-3xl font-black text-foreground tracking-tight">{user.name}</h1>
                                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${user.role === 'ADMIN'
                                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            : 'bg-primary/10 text-primary border-primary/20'
                                        }`}>
                                        {user.role === 'ADMIN' ? 'Yönetici' : 'Öğrenci'}
                                    </span>
                                </div>
                                <div className="text-muted-foreground text-sm font-medium flex flex-col md:flex-row items-center gap-2">
                                    <span>{user.university}</span>
                                    <span className="hidden md:inline text-muted-foreground/40">•</span>
                                    <span>{user.department}</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 pt-4 md:max-w-md">
                                <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-3 border border-border/50 text-center md:text-left group/stat hover:border-primary/30 transition-colors">
                                    <div className="text-2xl font-black text-foreground group-hover/stat:text-primary transition-colors">{stats.totalLikes}</div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Beğeni</div>
                                </div>
                                <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-3 border border-border/50 text-center md:text-left group/stat hover:border-primary/30 transition-colors">
                                    <div className="text-2xl font-black text-foreground group-hover/stat:text-primary transition-colors">{stats.totalViews}</div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Görüntülenme</div>
                                </div>
                                <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-3 border border-border/50 text-center md:text-left group/stat hover:border-primary/30 transition-colors">
                                    <div className="text-2xl font-black text-foreground group-hover/stat:text-primary transition-colors">{stats.totalNotes}</div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Paylaşım</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <button className="p-3 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border">
                                <Settings className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div>
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-2xl w-full md:w-fit mb-8 backdrop-blur-sm border border-border/50">
                        <button
                            onClick={() => setActiveTab('shared')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'shared'
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            <span>Paylaşılanlar</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('viewed')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'viewed'
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                }`}
                        >
                            <Trophy className="h-4 w-4" />
                            <span>Kütüphane</span>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* SHARED NOTES */}
                        {activeTab === 'shared' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {/* Add New Card */}
                                <Link href="/upload" className="group relative h-full min-h-[300px] border-2 border-dashed border-border hover:border-primary/50 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300">
                                    <div className="h-16 w-16 rounded-full bg-background border-2 border-border group-hover:border-primary/30 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-primary/20">
                                        <div className="text-3xl font-light text-foreground group-hover:text-primary transition-colors">+</div>
                                    </div>
                                    <span className="font-bold text-lg">Yeni Not Yükle</span>
                                    <p className="text-xs text-center mt-2 px-8 opacity-70">
                                        Başkalarıyla paylaşmak için ders notlarını yükle.
                                    </p>
                                </Link>

                                {notes.map(note => (
                                    <Link key={note.id} href={`/notes/${note.id}`} className="block transition-transform hover:scale-[1.02] active:scale-95 duration-300">
                                        <div className="relative h-full">
                                            <NodCard note={note} author={{ name: user.name, avatar: '' } as any} />

                                            {/* Status Overlay Badges */}
                                            {note.status === 'PENDING' && (
                                                <div className="absolute top-3 right-3 z-20">
                                                    <span className="bg-orange-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg ring-1 ring-white/20 animate-pulse">
                                                        ONAY BEKLİYOR
                                                    </span>
                                                </div>
                                            )}
                                            {note.status === 'REJECTED' && (
                                                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                                                    <span className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
                                                        <span>❌</span> Reddedildi
                                                    </span>
                                                </div>
                                            )}
                                            {note.status === 'SUSPENDED' && (
                                                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                                                    <span className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2">
                                                        <span>🚫</span> Askıya Alındı
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* PURCHASED NOTES */}
                        {activeTab === 'viewed' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {purchasedNotes.length > 0 ? (
                                    purchasedNotes.map((note: any) => {
                                        const authorName = note.uploader ? `${note.uploader.firstName || ''} ${note.uploader.lastName || ''}`.trim() : 'Bilinmiyor';
                                        return (
                                            <Link key={note.id} href={`/notes/${note.id}`} className="block transition-transform hover:scale-[1.02] active:scale-95 duration-300">
                                                <div className="relative h-full">
                                                    <NodCard note={note} author={{ name: authorName, avatar: '' } as any} />
                                                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg ring-1 ring-white/20 z-20 flex items-center gap-1">
                                                        <span>SATIN ALINDI</span>
                                                        <span>✓</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-border rounded-3xl bg-card/30">
                                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center">
                                            <span className="text-4xl text-muted-foreground opacity-50">🕸️</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-foreground">Henüz bir şey yok</h3>
                                            <p className="text-muted-foreground text-sm">Burada satın aldığınız notlar görünecek.</p>
                                        </div>
                                        <Link href="/" className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                            Markete Git
                                        </Link>
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
