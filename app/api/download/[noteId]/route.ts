import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isNoteUnlocked } from "@/app/actions/noteActions";

export async function GET(request: Request, props: { params: Promise<{ noteId: string }> }) {
    const params = await props.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { noteId } = params;

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const note = await prisma.note.findUnique({
            where: { id: noteId, deletedAt: null }
        });

        if (!note || !note.fileUrl) {
            return new NextResponse("Note file not found", { status: 404 });
        }

        // --- ACCESS CONTROL ---
        // 1. Owner can always access
        // 2. Admin can always access
        // 3. Buyer must have unlocked
        if (note.uploaderId !== user.id && user.role !== 'ADMIN') {
            const unlocked = await isNoteUnlocked(noteId);
            if (!unlocked) {
                return new NextResponse("Forbidden: Purchase required", { status: 403 });
            }
        }

        // --- PROXY STREAMING ---
        // Fetch from Blob Storage (Public but hidden URL)
        const fileResponse = await fetch(note.fileUrl);
        if (!fileResponse.ok) {
            console.error(`[DownloadProxy] Upstream fetch failed: ${fileResponse.status}`);
            return new NextResponse("File fetch error", { status: 502 });
        }

        // Stream back to client
        const headers = new Headers(fileResponse.headers);
        // Ensure inline display for PDF viewer
        headers.set("Content-Disposition", `inline; filename="otlak-note-${noteId}.pdf"`);
        headers.set("Cache-Control", "private, max-age=3600");

        return new NextResponse(fileResponse.body, {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error("[DownloadProxy] Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
