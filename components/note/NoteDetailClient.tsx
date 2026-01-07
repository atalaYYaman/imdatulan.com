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
}

export default function NoteDetailClient({ note, initialIsLiked, viewerUser }: NoteDetailClientProps) {
    const [isWarningAccepted, setIsWarningAccepted] = useState(false);

    return (
        <div className="flex flex-col h-full bg-[#002A30] text-white overflow-y-auto">
            {/* Yasal Uyarı Modal - Kabul edilmedikçe ekranı kilitler */}
            {!isWarningAccepted && (
                <LegalWarningModal onAccept={() => setIsWarningAccepted(true)} />
            )}

            <div className={`flex-1 flex flex-col md:flex-row transition-opacity duration-500 ${!isWarningAccepted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                {/* SOL TARAFLA: PDF / Dosya Görüntüleyici */}
                <div className="md:w-3/4 h-[80vh] md:h-screen bg-gray-900 relative border-r border-[#003E44]">
                    <NoteViewer
                        fileUrl={note.fileUrl}
                        viewerUser={viewerUser}
                    />
                </div>

                {/* SAĞ TARAF: Detaylar ve Etkileşim */}
                <div className="md:w-1/4 flex flex-col h-screen bg-[#002A30] border-l border-[#003E44]">

                    {/* Üst Bilgi */}
                    <div className="p-6 border-b border-[#003E44]">
                        <h1 className="text-xl font-bold text-[#22d3ee] mb-2">{note.title}</h1>
                        <div className="text-sm text-gray-400 space-y-1">
                            <p>{note.university} - {note.faculty}</p>
                            <p>{note.courseName} ({note.term})</p>
                            <p className="text-xs mt-2">Yükleyen: {note.uploader.firstName} {note.uploader.lastName}</p>
                        </div>
                    </div>

                    {/* Etkileşim Butonları */}
                    <div className="p-4 border-b border-[#003E44]">
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
