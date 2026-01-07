import { getNoteDetail, incrementView, isLikedByUser } from "@/app/actions/noteActions";
import NoteDetailClient from "@/components/note/NoteDetailClient";
import { notFound } from "next/navigation";

export default async function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) {
    const { noteId } = await params;
    const note = await getNoteDetail(noteId);

    if (!note) {
        notFound();
    }

    // Increment view count (server side)
    await incrementView(noteId);

    // Check if current user liked this note
    const isLiked = await isLikedByUser(noteId);

    return (
        <NoteDetailClient
            note={note}
            initialIsLiked={isLiked}
        />
    );
}
