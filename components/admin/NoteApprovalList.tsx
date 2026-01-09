'use client';

import { useState } from 'react';
// import { approveNote, rejectNote } from '@/app/actions/adminActions'; // Deprecated in favor of API routes
import { FileText, Download } from 'lucide-react';

type NoteData = {
    id: string;
    title: string;
    description: string | null;
    firstName?: string; // Mapped from uploader manually if needed? No, include uploader object
    uploader: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
    fileUrl: string;
    price: number;
    university: string;
    faculty: string;
    department: string;
    courseName?: string | null;
    createdAt: Date;
};

export default function NoteApprovalList({ notes }: { notes: NoteData[] }) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleApprove = async (noteId: string) => {
        if (!confirm('Notu onaylamak istediğinize emin misiniz?')) return;
        setActionLoading(noteId);

        try {
            const res = await fetch('/api/admin/notes/approve', {
                method: 'POST',
                body: JSON.stringify({ noteId }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error('Onay işlemi başarısız');

            alert('Not onaylandı ve kullanıcıya 3 Süt yüklendi.');
            window.location.reload(); // Refresh to update list
        } catch (error) {
            console.error(error);
            alert('Bir hata oluştu.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (noteId: string) => {
        const reason = prompt('Reddetme sebebi?');
        if (!reason) return;

        setActionLoading(noteId);
        try {
            const res = await fetch('/api/admin/notes/reject', {
                method: 'POST',
                body: JSON.stringify({ noteId, reason }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error('Reddetme işlemi başarısız');

            alert('Not reddedildi ve kullanıcı bilgilendirildi.');
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Bir hata oluştu.');
        } finally {
            setActionLoading(null);
        }
    };

    if (notes.length === 0) {
        return <div className="text-gray-400">Bekleyen not başvurusu yok.</div>;
    }

    return (
        <div className="grid gap-6">
            {notes.map(note => (
                <div key={note.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white">{note.title}</h3>
                            <p className="text-gray-400 text-sm mt-1">{note.description}</p>
                        </div>
                        <div className="bg-[#22d3ee]/10 text-[#22d3ee] px-3 py-1 rounded-full text-xs font-bold">
                            {note.price} Süt
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-900/50 p-4 rounded-lg">
                        <div>
                            <span className="text-gray-500 block">Yükleyen</span>
                            <span className="text-gray-300">{note.uploader.firstName} {note.uploader.lastName}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Ders</span>
                            <span className="text-gray-300">{note.courseName || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Okul/Bölüm</span>
                            <span className="text-gray-300">{note.university} / {note.department}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Dosya</span>
                            <a
                                href={note.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#22d3ee] hover:underline flex items-center gap-1 mt-1"
                            >
                                <FileText className="w-4 h-4" />
                                Önizle / İndir
                            </a>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={() => handleApprove(note.id)}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {actionLoading === note.id ? 'İşleniyor...' : 'Onayla'}
                        </button>
                        <button
                            onClick={() => handleReject(note.id)}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Reddet
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
