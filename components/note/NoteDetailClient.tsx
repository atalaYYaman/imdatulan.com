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

interface NoteDetailClientProps {
    note: NoteWithDetails;
    initialIsLiked: boolean;
    viewerUser: {
        name: string;
        studentNumber: string;
    };
    isUnlocked: boolean;
}

export default function NoteDetailClient({ note, initialIsLiked, viewerUser, isUnlocked: initialIsUnlocked }: NoteDetailClientProps) {
    const [isWarningAccepted, setIsWarningAccepted] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(initialIsUnlocked);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto">
            {/* Yasal Uyarı Modal - Kabul edilmedikçe ekranı kilitler */}
            {!isWarningAccepted && (
                <LegalWarningModal onAccept={() => setIsWarningAccepted(true)} />
            )}

            <div className={`flex-1 flex flex-col md:flex-row transition-opacity duration-500 ${!isWarningAccepted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                {/* SOL TARAFLA: PDF / Dosya Görüntüleyici */}
                <div className="md:w-3/4 h-[80vh] md:h-screen bg-muted/20 relative border-r border-border">
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
                <div className="md:w-1/4 flex flex-col h-screen bg-card border-l border-border">

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
