'use client';

import { useState } from 'react';
import NoteViewer from './NoteViewer';
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
}

export default function NoteDetailClient({ note, initialIsLiked, viewerUser, isUnlocked: initialIsUnlocked, currentUserId }: NoteDetailClientProps) {
    const [isWarningAccepted, setIsWarningAccepted] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(initialIsUnlocked);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false); // Modal State

    const isOwner = currentUserId === note.uploaderId;

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

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] bg-background text-foreground overflow-hidden relative">
            {/* Report Modal */}
            {isReportModalOpen && (
                <ReportModal noteId={note.id} onClose={() => setIsReportModalOpen(false)} />
            )}

            {/* Suspended Banner */}
            {note.status === 'SUSPENDED' && (
                <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
                    <span className="text-lg">⚠️</span>
                    Bu içerik şu anda askıya alınmıştır. Sadece siz ve önceden satın alanlar görüntüleyebilir.
                    {note.rejectionReason && <span className="text-foreground/60 font-normal ml-1">({note.rejectionReason})</span>}
                </div>
            )}

            {/* Yasal Uyarı Modal - Kabul edilmedikçe ekranı kilitler */}
            {!isWarningAccepted && (
                <LegalWarningModal onAccept={() => setIsWarningAccepted(true)} />
            )}

            <div className={`flex-1 flex flex-col md:flex-row h-full transition-opacity duration-500 ${!isWarningAccepted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                {/* SOL TARAFLA: PDF / Dosya Görüntüleyici */}
                <div className="md:w-3/4 h-full bg-muted/20 relative border-r border-border">
                    <NoteViewer
                        fileUrl={note.fileUrl}
                        viewerUser={viewerUser}
                        isLocked={!isUnlocked}
                        onUnlock={handleUnlockNote}
                        isUnlocking={isUnlocking}
                        price={note.price}
                        errorMessage={errorMessage}
                    />
                </div>

                {/* SAĞ TARAF: Detaylar ve Etkileşim */}
                <div className="md:w-1/4 flex flex-col h-full bg-card border-l border-border">

                    {/* Üst Bilgi */}
                    <div className="p-6 border-b border-border">
                        <h1 className="text-xl font-bold text-primary mb-2">{note.title}</h1>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>{note.university} - {note.faculty}</p>
                            <p>{note.courseName} ({note.term})</p>
                            {note.description && (
                                <p className="text-foreground/80 italic text-xs mt-2 border-l-2 border-primary pl-2 py-1">
                                    "{note.description}"
                                </p>
                            )}
                            <p className="text-xs mt-2 text-primary/80">Yükleyen: {note.uploader.firstName} {note.uploader.lastName}</p>
                        </div>
                    </div>

                    {/* Etkileşim Butonları */}
                    <div className="p-4 border-b border-border">
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
                    <div className="flex-1 overflow-y-auto">
                        <CommentSection
                            noteId={note.id}
                            initialComments={note.comments}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
