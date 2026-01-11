import { getNoteDetail, incrementView, isLikedByUser } from "@/app/actions/noteActions";
import NoteDetailClient from "@/components/note/NoteDetailClient";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) {
    try {
        const { noteId } = await params;
        const note = await getNoteDetail(noteId);
        const session = await getServerSession(authOptions);

        if (!session) {
            redirect('/');
        }

        if (!note) {
            notFound();
        }

        // Increment view count (server side)
        try {
            await incrementView(noteId);
        } catch (e) {
            console.error("View increment error:", e);
        }

        // Check if current user liked this note
        const isLiked = await isLikedByUser(noteId);

        // Kilit Kontrolü (Süt Sistemi)
        const { isNoteUnlocked } = await import("@/app/actions/noteActions");
        const isUnlocked = await isNoteUnlocked(noteId);

        // Get viewer info for watermark
        let viewerUser = {
            name: "Misafir Kullanıcı",
            studentNumber: ""
        };
        let currentUserId: string | undefined = undefined;

        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true, firstName: true, lastName: true, studentNumber: true }
            });

            if (user) {
                viewerUser = {
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || session.user.name || "Kullanıcı",
                    studentNumber: user.studentNumber || ""
                };
                currentUserId = user.id;
            }
        }

        return (
            <NoteDetailClient
                note={note}
                initialIsLiked={isLiked}
                viewerUser={viewerUser}
                isUnlocked={isUnlocked}
                currentUserId={currentUserId}
            />
        );
    } catch (error: any) {
        console.error("NoteDetailPage Critical Error:", error);
        return (
            <div className="p-8 text-center text-white bg-slate-900 h-screen flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Bir Hata Oluştu</h1>
                <p className="mb-4">İçerik yüklenirken bir sorun yaşandı.</p>
                <div className="bg-slate-800 p-4 rounded text-left overflow-auto max-w-lg">
                    <p className="text-red-400 font-mono text-sm">{error?.message || "Bilinmeyen Hata"}</p>
                    {error?.digest && <p className="text-gray-500 text-xs mt-2">Error ID: {error.digest}</p>}
                </div>
            </div>
        );
    }
}
