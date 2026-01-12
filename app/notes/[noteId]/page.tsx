import { getNoteDetail, incrementView, isLikedByUser, isNoteUnlocked } from "@/app/actions/noteActions";
import NoteDetailClient from "@/components/note/NoteDetailClient";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) {
    const { noteId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/');
    }

    // Move data fetching outside try/catch if possible, or handle errors specifically.
    // However, getNoteDetail might throw.
    // Best practice: Let fatal errors bubble to error.tsx, but here we have custom error UI.
    // We must check if the error is a redirect/not-found error.

    let note;
    try {
        note = await getNoteDetail(noteId);
    } catch (e) {
        console.error("Failed to fetch note:", e);
        // Let it fall through to !note check or specific error UI
    }

    if (!note) {
        notFound();
    }

    try {
        // Increment view count (server side)
        try {
            await incrementView(noteId);
        } catch (e) {
            console.error("View increment error:", e);
        }

        // Check if current user liked this note
        const isLiked = await isLikedByUser(noteId);

        // Kilit Kontrolü (Süt Sistemi)
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

        // Orijinal dosya uzantısını al
        const fileUrl = note.fileUrl || "";
        const originalExtension = fileUrl.split('.').pop()?.toLowerCase() || "pdf";

        // Proxy URL'i oluştur
        // SECURITY: We explicitly do NOT pass the raw note.fileUrl to the client.
        // We overwrite it with the proxy link.
        const secureNote = {
            ...note,
            fileUrl: `/api/download/${note.id}`
        };

        return (
            <NoteDetailClient
                note={secureNote}
                initialIsLiked={isLiked}
                viewerUser={viewerUser}
                isUnlocked={isUnlocked}
                currentUserId={currentUserId}
                fileExtension={originalExtension}
            />
        );
    } catch (error: any) {
        // Re-throw internal Next.js errors (Redirect/NotFound are not typically caught by simple try/catch unless using 'any' and blocking bubbling? 
        // Actually, redirect() implementations often strictly check for the throw.
        // If we act on error, we might interrupt it.
        // Safer: Check if error is digest/NextJS specific? 
        // Simplest: The above 'redirect' and 'notFound' are OUTSIDE this try/catch now for the most part (except fetching logic).

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
