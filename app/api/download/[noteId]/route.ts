import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { PDFDocument } from "pdf-lib";

export async function GET(request: Request, props: { params: Promise<{ noteId: string }> }) {
    const params = await props.params;
    const { noteId } = params;

    try {
        // Zero Trust: Always verify session first
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Zero Trust: Validate noteId format to prevent injection
        if (!noteId || typeof noteId !== 'string' || noteId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(noteId)) {
            return new NextResponse("Invalid note ID", { status: 400 });
        }

        // Zero Trust: Fetch user from database to verify existence and get role
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const userId = user.id;

        // --- RATE LIMIT CHECK ---
        // 10 requests / 1 minute
        const limitCheck = await checkRateLimit(`download_${userId}`, 10, 60);
        if (!limitCheck.success) {
            return new NextResponse(limitCheck.message || "Too Many Requests", { status: 429 });
        }

        // 1. Fetch Note & Verify Existence (Zero Trust: Always verify)
        const note = await prisma.note.findUnique({
            where: { id: noteId, deletedAt: null },
            select: {
                id: true,
                fileUrl: true,
                uploaderId: true,
                title: true,
                pageCount: true, // For preview calculation
                status: true, // Zero Trust: Check status
            }
        });

        if (!note || !note.fileUrl) {
            return new NextResponse("Note file not found", { status: 404 });
        }

        // Zero Trust: Check note status
        if (note.status === 'PENDING' || note.status === 'REJECTED') {
            // Only owner or admin can access pending/rejected notes
            if (note.uploaderId !== userId && user.role !== 'ADMIN') {
                return new NextResponse("Note not available", { status: 403 });
            }
        }

        // Zero Trust: SUSPENDED notes - only owner, admin, or previous buyers
        if (note.status === 'SUSPENDED') {
            if (note.uploaderId !== userId && user.role !== 'ADMIN') {
                // Check if user previously unlocked this note
                const wasUnlocked = await prisma.unlockedNote.findUnique({
                    where: {
                        userId_noteId: {
                            userId: userId,
                            noteId: noteId
                        }
                    }
                });
                if (!wasUnlocked) {
                    return new NextResponse("Note suspended", { status: 403 });
                }
            }
        }

        // 2. Access Control (Zero Trust: Multiple verification layers)
        // Check 1: Is Owner?
        const isOwner = note.uploaderId === userId;

        // Check 2: Is Admin? (Zero Trust: Verify from database, not session)
        const isAdmin = user.role === 'ADMIN';

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

        // 3. Analytics (Record View) - Only for full access
        if (hasAccess) {
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
        }

        // 4. Fetch File (Zero Trust: Validate fileUrl)
        // Validate fileUrl format to prevent SSRF attacks
        if (!note.fileUrl || typeof note.fileUrl !== 'string') {
            return new NextResponse("Invalid file URL", { status: 500 });
        }

        // Zero Trust: Ensure fileUrl is from trusted source (Vercel Blob)
        const trustedDomains = ['blob.vercel-storage.com', 'pub-'];
        const isTrustedUrl = trustedDomains.some(domain => note.fileUrl.includes(domain));
        if (!isTrustedUrl) {
            console.error(`[DownloadProxy] Untrusted file URL: ${note.fileUrl}`);
            return new NextResponse("Invalid file source", { status: 403 });
        }

        const fileResponse = await fetch(note.fileUrl);
        if (!fileResponse.ok) {
            console.error(`[DownloadProxy] Upstream fetch failed: ${fileResponse.status}`);
            return new NextResponse("File fetch error", { status: 502 });
        }

        const fileArrayBuffer = await fileResponse.arrayBuffer();
        const contentType = fileResponse.headers.get("content-type") || "application/pdf";
        const isPdf = contentType.includes("pdf") || note.fileUrl.toLowerCase().endsWith(".pdf");

        // 5. Process PDF for preview if locked (Zero Trust: Always verify access)
        let finalFileBuffer: ArrayBuffer = fileArrayBuffer;
        if (isPdf && !hasAccess) {
            try {
                let pdfDoc = await PDFDocument.load(fileArrayBuffer);
                const totalPageCount = note.pageCount || pdfDoc.getPageCount();
                
                // Dynamic preview logic (Zero Trust: Limit preview to prevent abuse)
                let PREVIEW_PAGE_COUNT: number;
                if (totalPageCount <= 5) {
                    PREVIEW_PAGE_COUNT = 1;
                } else if (totalPageCount <= 10) {
                    PREVIEW_PAGE_COUNT = 2;
                } else {
                    PREVIEW_PAGE_COUNT = 3;
                }
                
                PREVIEW_PAGE_COUNT = Math.min(PREVIEW_PAGE_COUNT, totalPageCount);
                
                if (totalPageCount > PREVIEW_PAGE_COUNT) {
                    const previewPdf = await PDFDocument.create();
                    const pagesToCopy = Array.from({ length: PREVIEW_PAGE_COUNT }, (_, i) => i);
                    const copiedPages = await previewPdf.copyPages(pdfDoc, pagesToCopy);
                    
                    copiedPages.forEach((page) => {
                        previewPdf.addPage(page);
                    });
                    
                    // Note: Watermark is handled client-side in NoteViewer component
                    // Convert Uint8Array to ArrayBuffer
                    const previewBytes = await previewPdf.save();
                    finalFileBuffer = previewBytes.buffer.slice(previewBytes.byteOffset, previewBytes.byteOffset + previewBytes.byteLength);
                }
            } catch (error) {
                console.error("Preview processing failed:", error);
                // Zero Trust: On error, deny access rather than showing full file
                return new NextResponse("Preview processing failed", { status: 500 });
            }
        }

        // 6. Stream back with Security Headers
        const headers = new Headers();

        // --- SENTINEL HEADERS ---
        // Prevent caching on public/shared devices
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");
        headers.set("Content-Type", contentType);

        // Force inline display but with correct filename
        headers.set("Content-Disposition", `inline; filename="${note.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.pdf"`);
        
        // Add preview indicator header
        if (!hasAccess && isPdf) {
            headers.set("X-Preview-Mode", "true");
        }

        // Zero Trust: Ensure we're returning the correct buffer type
        const responseBuffer = finalFileBuffer instanceof ArrayBuffer 
            ? finalFileBuffer 
            : finalFileBuffer.buffer.slice(finalFileBuffer.byteOffset, finalFileBuffer.byteOffset + finalFileBuffer.byteLength);

        return new NextResponse(responseBuffer, {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error("[DownloadProxy] Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
