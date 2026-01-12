'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const NoteViewer = dynamic(() => import('./NoteViewer'), {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-muted/20 animate-pulse rounded-lg" />
});
import InteractionBar from './InteractionBar';
import CommentSection from './CommentSection';
import LegalWarningModal from './LegalWarningModal';
import { Note, Comment, User } from '@prisma/client';

type NoteWithDetails = Note & {
    uploader: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        university: string | null;
        department: string | null;
    };
    rejectionReason: string | null;
    status: string;
    _count: {
        likes: number;
        comments: number;
    };
    comments: (Comment & {
        user: {
            firstName: string | null;
            lastName: string | null;
        };
    })[];
};

import Link from "next/link";
import ReportModal from "./ReportModal";

interface NoteDetailClientProps {
    note: NoteWithDetails;
    initialIsLiked: boolean;
    viewerUser: {
        name: string;
        studentNumber: string;
    };
    isUnlocked: boolean;
    currentUserId?: string; // New Prop
    fileExtension?: string;
}

export default function NoteDetailClient({ note, initialIsLiked, viewerUser, isUnlocked: initialIsUnlocked, currentUserId, fileExtension }: NoteDetailClientProps) {
    const [isWarningAccepted, setIsWarningAccepted] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(initialIsUnlocked);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false); // Modal State

    const isOwner = currentUserId === note.uploaderId;

    const [mobileTab, setMobileTab] = useState<'note' | 'details'>('note');

    const handleUnlockNote = async () => {
        setIsUnlocking(true);
        setErrorMessage(null);
        try {
            const { unlockNote } = await import('@/app/actions/noteActions');
            const result = await unlockNote(note.id);
            if (result.success) {
                setIsUnlocked(true);
            } else {
                setErrorMessage(result.message || "Bir hata oluştu");
            }
        } catch (error) {
            console.error("Unlock error:", error);
            setErrorMessage("Beklenmedik bir hata oluştu");
        } finally {
            setIsUnlocking(false);
        }
    };

    // Resizable Panel Logic
    const [sidebarWidth, setSidebarWidth] = useState(400); // Default width in px
    const [isDragging, setIsDragging] = useState(false);

    const startResizing = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsDragging(true);
    };

    const stopResizing = () => {
        setIsDragging(false);
    };

    const resize = (mouseMoveEvent: React.MouseEvent) => {
        if (isDragging) {
            // Calculate new width relative to right edge of screen
            // Since it's a right sidebar, width = windowWidth - mouseX
            const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;

            // Limit width (min 300px, max 800px or 60% of screen)
            if (newWidth > 300 && newWidth < Math.min(800, document.body.clientWidth * 0.6)) {
                setSidebarWidth(newWidth);
            }
        }
    };

    // Attach global mouse events for smoother dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", resize as any);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resize as any);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize as any);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isDragging]);


    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-background text-foreground overflow-hidden relative">
            {/* Report Modal */}
            {isReportModalOpen && (
                <ReportModal noteId={note.id} onClose={() => setIsReportModalOpen(false)} />
            )}

            {/* Status Banners */}
            {/* 1. PENDING */}
            {note.status === 'PENDING' && (
                <div className="bg-orange-500/10 border-b border-orange-500/20 text-orange-500 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                    <span className="text-lg">⏳</span>
                    Bu not onay beklemektedir. Şu an sadece siz ve yöneticiler görebilir.
                </div>
            )}

            {/* 2. REJECTED */}
            {note.status === 'REJECTED' && (
                <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 px-4 py-2 text-center text-sm font-medium flex flex-col md:flex-row items-center justify-center gap-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">❌</span>
                        <span>Bu içerik reddedilmiştir.</span>
                    </div>
                    {note.rejectionReason && (
                        <span className="bg-red-500/10 px-2 py-0.5 rounded text-xs border border-red-500/20">
                            Sebep: {note.rejectionReason}
                        </span>
                    )}
                </div>
            )}

            {/* 3. SUSPENDED */}
            {note.status === 'SUSPENDED' && (
                <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                    <span className="text-lg">⚠️</span>
                    Bu içerik şu anda askıya alınmıştır. Sadece siz ve önceden satın alanlar görüntüleyebilir.
                    {note.rejectionReason && <span className="text-foreground/60 font-normal ml-1">({note.rejectionReason})</span>}
                </div>
            )}

            {/* 4. PURCHASED (Unlocked & Not Owner) */}
            {isUnlocked && !isOwner && note.status === 'APPROVED' && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-500 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                    <span className="text-lg">✅</span>
                    Bu notu satın aldınız.
                </div>
            )}

            {/* Yasal Uyarı Modal - Kabul edilmedikçe ekranı kilitler */}
            {!isWarningAccepted && (
                <LegalWarningModal onAccept={() => setIsWarningAccepted(true)} />
            )}

            {/* Mobile Tab Switcher */}
            <div className={`md:hidden flex border-b border-border/50 bg-background/95 backdrop-blur z-20 transition-opacity duration-500 ${!isWarningAccepted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <button
                    onClick={() => setMobileTab('note')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${mobileTab === 'note' ? 'text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}
                >
                    Not Görüntüle
                    {mobileTab === 'note' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in zoom-in" />}
                </button>
                <button
                    onClick={() => setMobileTab('details')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${mobileTab === 'details' ? 'text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}
                >
                    Detaylar & Yorumlar
                    {mobileTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in zoom-in" />}
                </button>
            </div>

            <div className={`flex-1 flex flex-col md:flex-row h-full transition-opacity duration-500 overflow-hidden ${!isWarningAccepted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                {/* SOL TARAFLA: PDF / Dosya Görüntüleyici */}
                {/* Mobile: Show only if tab is 'note'. Desktop: Use remaining space (flex-1). */}
                <div className={`flex-1 h-full bg-muted/20 relative md:border-r border-border/50 ${mobileTab !== 'note' ? 'hidden md:block' : 'block'}`}>
                    <NoteViewer
                        fileUrl={note.fileUrl || `/api/download/${note.id}`}
                        viewerUser={viewerUser}
                        isLocked={!isUnlocked}
                        onUnlock={handleUnlockNote}
                        isUnlocking={isUnlocking}
                        price={note.price}
                        errorMessage={errorMessage}
                        fileExtension={fileExtension}
                    />
                </div>

                {/* DRAGGER HANDLE (Desktop Only) */}
                <div
                    className="hidden md:flex w-1 bg-border/50 hover:bg-primary/50 cursor-col-resize items-center justify-center transition-colors group z-30"
                    onMouseDown={startResizing}
                >
                    <div className="w-1 h-8 bg-border group-hover:bg-primary rounded-full transition-colors" />
                </div>

                {/* SAĞ TARAF: Detaylar ve Etkileşim */}
                {/* Mobile: Show only if tab is 'details'. Desktop: Fixed or Resizable width. */}
                <div
                    style={{ width: mobileTab === 'details' ? '100%' : undefined }}
                    className={`flex-col h-full bg-card/80 backdrop-blur-md border-l border-border/50 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] ${mobileTab === 'details' ? 'flex w-full' : 'hidden md:flex'}`}
                >
                    {/* Desktop Dynamic Width Wrapper */}
                    <div style={{ width: mobileTab === 'details' ? '100%' : sidebarWidth }} className="flex flex-col h-full">

                        {/* Üst Bilgi */}
                        <div className="p-6 border-b border-border/50">
                            <div className='flex items-start justify-between mb-4'>
                                <h1 className="text-lg font-bold text-foreground leading-tight line-clamp-2">{note.title}</h1>
                                <span className='px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold uppercase tracking-wider border border-primary/10 whitespace-nowrap'>
                                    {note.type ? note.type.split(' ')[0] : 'NOT'}
                                </span>
                            </div>

                            <div className="text-xs text-muted-foreground space-y-1.5">
                                <div className='flex items-center gap-2'>
                                    <span className='w-1.5 h-1.5 rounded-full bg-primary shrink-0' />
                                    <p className='font-medium'>{note.university}</p>
                                </div>
                                <div className='flex items-center gap-2 pl-3.5'>
                                    <p className='opacity-80'>{note.faculty}</p>
                                </div>
                                <div className='flex items-center gap-2 pl-3.5'>
                                    <p className='opacity-80'>{note.courseName} <span className='opacity-50'>•</span> {note.term}</p>
                                </div>

                                {note.description && (
                                    <div className="mt-4 p-3 bg-secondary/30 rounded-lg text-foreground/90 italic text-xs leading-relaxed">
                                        "{note.description}"
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                                    <div className='flex items-center gap-2'>
                                        <div className='w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold'>
                                            {note.uploader.firstName ? note.uploader.firstName[0] : 'U'}
                                        </div>
                                        <p className="font-medium">
                                            {note.uploader.firstName} {note.uploader.lastName}
                                        </p>
                                    </div>
                                    <span className='text-[10px] opacity-50'>{new Date(note.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Etkileşim Butonları */}
                        <div className="p-4 border-b border-border/50">
                            <InteractionBar
                                noteId={note.id}
                                initialLikeCount={note._count.likes}
                                initialIsLiked={initialIsLiked}
                                viewCount={note.viewCount}
                                isOwner={isOwner}
                                onReport={() => setIsReportModalOpen(true)}
                            />
                        </div>

                        {/* Yorumlar (Kaydırılabilir Alan) */}
                        <div className="flex-1 overflow-y-auto bg-muted/10 h-full">
                            <CommentSection
                                noteId={note.id}
                                initialComments={note.comments}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
