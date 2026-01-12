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
            where: { id: noteId, deletedAt: null } // Ensure not deleted
        });

        if (!note || !note.fileUrl) {
            return new NextResponse("Note text not found", { status: 404 });
        }

        // --- ACCESS CONTROL ---
        // 1. Owner can always access
        if (note.uploaderId === user.id) {
            // Allow
        }
        // 2. Admin can always access
        else if (user.role === 'ADMIN') {
            // Allow
        }
        // 3. Buyer must have unlocked
        else {
            const unlocked = await isNoteUnlocked(noteId);
            if (!unlocked) {
                return new NextResponse("Forbidden: Purchase required", { status: 403 });
            }
        }

        // --- PROXY STREAMING ---
        // Fetch from Blob Storage (which is public-read but obscure/UUID)
        const fileResponse = await fetch(note.fileUrl, {
            headers: {
                // Required for Private Folder/Blob access on Vercel
                'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
            }
        });
        if (!fileResponse.ok) {
            return new NextResponse("File fetch error", { status: 502 });
        }

        // Stream back to client
        // Set headers for download or view
        const headers = new Headers(fileResponse.headers);
        headers.set("Content-Disposition", `inline; filename="otlak-note-${noteId}.pdf"`);
        headers.set("Cache-Control", "private, max-age=3600"); // Cache for 1 hour locally for performance

        return new NextResponse(fileResponse.body, {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error("File Proxy Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
