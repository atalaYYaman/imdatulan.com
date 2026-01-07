import { getNoteDetail, incrementView, isLikedByUser } from "@/app/actions/noteActions";
import NoteDetailClient from "@/components/note/NoteDetailClient";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) {
    const { noteId } = await params;
    const note = await getNoteDetail(noteId);
    const session = await getServerSession(authOptions);

    if (!note) {
        notFound();
    }

    // Increment view count (server side)
    await incrementView(noteId);

    // Check if current user liked this note
    const isLiked = await isLikedByUser(noteId);

    // Get viewer info for watermark
    let viewerUser = {
        name: "Misafir Kullanıcı",
        studentNumber: ""
    };

    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { firstName: true, lastName: true, studentNumber: true }
        });

        if (user) {
            viewerUser = {
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || session.user.name || "Kullanıcı",
                studentNumber: user.studentNumber || ""
            };
        }
    }

    return (
        <NoteDetailClient
            note={note}
            initialIsLiked={isLiked}
            viewerUser={viewerUser}
        />
    );
}
