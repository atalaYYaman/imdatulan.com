import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PDFDocument, rgb, degrees } from "pdf-lib";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ noteId: string }> }
) {
    try {
        const { noteId } = await params;
        const session = await getServerSession(authOptions);

        // 1. Auth Check (Public notes might be allowed, but let's assume login required for now based on app logic)
        // Adjust based on your 'guest' policy. The viewer passes dummy user if not logged in.
        // But for *content*, usually we want at least basic tracking.
        // If session is null, we can still serve PREVIEW (1st page) if we want?
        // Let's mimic 'getNoteDetail' logic + unlock check.

        let user = null;
        if (session?.user?.email) {
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true, email: true, firstName: true, lastName: true, studentNumber: true, role: true }
            });
        }

        // 2. Fetch Note
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            select: {
                id: true,
                fileUrl: true,
                price: true,
                uploaderId: true,
                status: true,
                rejectionReason: true,
            }
        });

        if (!note || !note.fileUrl) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // 3. Access Control
        // If status is PENDING/REJECTED/SUSPENDED, check permissions.
        // (Simplified for brevity, ensuring basic security)
        if (note.status !== 'APPROVED') {
            const isOwner = user && note.uploaderId === user.id;
            const isAdmin = user && user.role === 'ADMIN'; // Assuming role field
            // Suspended check logic from noteActions...
            // For now, if not approved and not owner, block.
            if (!isOwner && !isAdmin) {
                // Special case: SUSPENDED allowed for existing buyers? 
                // Implement if needed, for now block.
                return new NextResponse("Unauthorized", { status: 403 });
            }
        }

        // 4. Check Unlock Status
        let isUnlocked = false;
        if (user) {
            if (note.uploaderId === user.id) isUnlocked = true;
            else {
                const unlockedParams = {
                    userId_noteId: {
                        userId: user.id,
                        noteId
                    }
                };
                // Check simple unlock
                const unlock = await prisma.unlockedNote.findUnique({ where: unlockedParams });
                if (unlock) isUnlocked = true;
            }
        }

        // 5. Fetch File from Blob
        const response = await fetch(note.fileUrl);
        if (!response.ok) {
            console.error("Blob fetch failed:", response.statusText);
            return new NextResponse("File Fetch Error", { status: 502 });
        }
        const fileArrayBuffer = await response.arrayBuffer();

        // 6. Processing
        // Check content type
        const contentType = response.headers.get("content-type") || "application/pdf";
        const isPdf = contentType.includes("pdf") || note.fileUrl.toLowerCase().endsWith(".pdf");

        if (isPdf) {
            const pdfDoc = await PDFDocument.load(fileArrayBuffer);

            // If LOCKED: Only keep first page
            if (!isUnlocked) {
                // If it has more than 1 page, remove others
                const pageCount = pdfDoc.getPageCount();
                if (pageCount > 1) {
                    // Indices are 0-based. Keep 0. Remove 1..N
                    // removePage is usually safe from end to start to avoid index shift, 
                    // or just copy first page to new doc.
                    // Copying is safer.
                    const newPdf = await PDFDocument.create();
                    const [firstPage] = await newPdf.copyPages(pdfDoc, [0]);
                    newPdf.addPage(firstPage);
                    // work with simple new doc
                    // Re-assign pdfDoc variable? referencing might be tricky with types.
                    // Let's just modify the original if easier, or save the new one.
                    // Easier: Delete pages from end.
                    for (let i = pageCount - 1; i > 0; i--) {
                        pdfDoc.removePage(i);
                    }
                }
            }

            // WATERMARK
            // Get user info or default
            const watermarkText = "OTLAK.COM.TR";
            const userName = user
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
                : "MISAFIR KULLANICI";
            const userSub = user?.studentNumber || (session?.user?.email || "IP: " + (request.headers.get("x-forwarded-for") || "Gizli"));

            const pages = pdfDoc.getPages();
            const { width, height } = pages[0].getSize();

            pages.forEach(page => {
                const { width, height } = page.getSize();
                // Draw a grid of watermarks
                const cols = 3;
                const rows = 4;
                const xSp = width / cols;
                const ySp = height / rows;

                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        page.drawText(watermarkText, {
                            x: i * xSp + 20,
                            y: j * ySp + 40,
                            size: 30,
                            color: rgb(0.8, 0.85, 0.9), // Slate-300 like
                            opacity: 0.3,
                            rotate: degrees(30),
                        });
                        page.drawText(userName, {
                            x: i * xSp + 20,
                            y: j * ySp + 20,
                            size: 14,
                            color: rgb(0.9, 0.4, 0.4), // Redish
                            opacity: 0.2,
                            rotate: degrees(30),
                        });
                        page.drawText(userSub, {
                            x: i * xSp + 20,
                            y: j * ySp + 5,
                            size: 10,
                            color: rgb(0.6, 0.6, 0.7),
                            opacity: 0.3,
                            rotate: degrees(30),
                        });
                    }
                }
            });

            const pdfBytes = await pdfDoc.save();

            return new NextResponse(Buffer.from(pdfBytes), {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": "inline; filename=\"note-secure.pdf\"",
                    // Cache control: Private to ensure no shared caching of watermarked content
                    "Cache-Control": "private, no-cache, no-store, must-revalidate",
                }
            });

        } else {
            // Not PDF (Image?)
            // If unlocked, stream original. 
            // If locked, maybe blur it? or just fail?
            // NoteViewer handles blur via CSS, but user can remove CSS.
            // Secure way: Server-side blur.
            // Without 'sharp'/'jimp', simple pixel manipulation is hard.
            // For now: If unlocked, stream. If locked, return 403 or placeholder.

            if (!isUnlocked) {
                // For security, do not send the file.
                // NoteViewer will fail to load, showing error.
                // Ideally we send a placeholder image.
                return new NextResponse("Preview not available for this file type", { status: 403 });
            }

            // Stream image
            return new NextResponse(fileArrayBuffer, {
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "private, max-age=3600",
                }
            });
        }

    } catch (error) {
        console.error("API File Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
