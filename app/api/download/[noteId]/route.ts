import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request, props: { params: Promise<{ noteId: string }> }) {
    const params = await props.params;
    const { noteId } = params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;

        // --- RATE LIMIT CHECK ---
        // 10 requests / 1 minute
        const limitCheck = await checkRateLimit(`download_${userId}`, 10, 60);
        if (!limitCheck.success) {
            return new NextResponse(limitCheck.message || "Too Many Requests", { status: 429 });
        }

        // 1. Fetch Note & Verify Existence
        const note = await prisma.note.findUnique({
            where: { id: noteId, deletedAt: null },
            select: {
                id: true,
                fileUrl: true,
                uploaderId: true,
                title: true
            }
        });

        if (!note || !note.fileUrl) {
            return new NextResponse("Note file not found", { status: 404 });
        }

        // 2. Access Control (Zero Trust)
        // Check 1: Is Owner?
        const isOwner = note.uploaderId === userId;

        // Check 2: Is Admin?
        const isAdmin = session.user.role === 'ADMIN';

        let hasAccess = isOwner || isAdmin;

        // Check 3: Is Unlocked? (If not owner/admin)
        if (!hasAccess) {
            const unlocked = await prisma.unlockedNote.findUnique({
                where: {
                    userId_noteId: {
                        userId: userId,
                        noteId: noteId
                    }
                }
            });
            if (unlocked) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return new NextResponse("Forbidden: Purchase required", { status: 403 });
        }

        // 3. Analytics (Record View)
        try {
            const existingView = await prisma.view.findUnique({
                where: { userId_noteId: { userId, noteId } }
            });

            if (!existingView) {
                await prisma.$transaction([
                    prisma.view.create({
                        data: { userId, noteId }
                    }),
                    prisma.note.update({
                        where: { id: noteId },
                        data: { viewCount: { increment: 1 } }
                    })
                ]);
            }
        } catch (error) {
            console.error("View logging failed:", error);
            // Non-blocking for download
        }

        // 4. Proxy Streaming
        const fileResponse = await fetch(note.fileUrl);
        if (!fileResponse.ok) {
            console.error(`[DownloadProxy] Upstream fetch failed: ${fileResponse.status}`);
            return new NextResponse("File fetch error", { status: 502 });
        }

        // Stream back with Security Headers
        const headers = new Headers(fileResponse.headers);

        // --- SENTINEL HEADERS ---
        // Prevent caching on public/shared devices
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");

        // Force inline display but with correct filename
        headers.set("Content-Disposition", `inline; filename="${note.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.pdf"`);
        // Remove potentially leaking upstream headers
        headers.delete("x-vercel-id");
        headers.delete("server");

        return new NextResponse(fileResponse.body, {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error("[DownloadProxy] Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
