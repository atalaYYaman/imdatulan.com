import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lockedPlaceholderNextResponse } from "@/lib/lockedPlaceholderResponse";
import { PDFDocument, rgb, degrees } from "pdf-lib";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ noteId: string }> }
) {
    try {
        const { noteId } = await params;
        const session = await getServerSession(authOptions);

        const fileIndex = Math.max(0, parseInt(request.nextUrl.searchParams.get("fileIndex") || "0", 10) || 0);

        let user = null;
        if (session?.user?.email) {
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true, email: true, firstName: true, lastName: true, studentNumber: true, role: true }
            });
        }

        const note = await prisma.note.findUnique({
            where: { id: noteId },
            select: {
                id: true,
                fileUrl: true,
                price: true,
                uploaderId: true,
                status: true,
                rejectionReason: true,
                pageCount: true,
                files: { orderBy: { sortOrder: "asc" }, select: { fileUrl: true, fileExtension: true, pageCount: true } }
            }
        });

        let fileUrl: string;
        let pageCount: number | null;
        if (note?.files?.length) {
            const idx = Math.min(fileIndex, note.files.length - 1);
            const f = note.files[idx];
            fileUrl = f?.fileUrl ?? "";
            pageCount = f?.pageCount ?? null;
        } else if (note?.fileUrl) {
            fileUrl = note.fileUrl;
            pageCount = note.pageCount;
        } else {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (!note || !fileUrl) {
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

        // 4. Check Unlock Status (Zero Trust: Only owners get full access, admins must purchase)
        let isUnlocked = false;
        if (user) {
            // Zero Trust: Only owners get full access without purchase
            if (note.uploaderId === user.id) {
                isUnlocked = true;
            } else {
                // Zero Trust: Admins and regular users must purchase (check unlock status)
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

        const response = await fetch(fileUrl);
        if (!response.ok) {
            console.error("Blob fetch failed:", response.statusText);
            return new NextResponse("File Fetch Error", { status: 502 });
        }
        const fileArrayBuffer = await response.arrayBuffer();

        const contentType = response.headers.get("content-type") || "application/pdf";
        const isPdf = contentType.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf");

        if (isPdf) {
            let pdfDoc = await PDFDocument.load(fileArrayBuffer);

            // If LOCKED: Show dynamic preview based on total page count
            if (!isUnlocked) {
                const docPageCount = pdfDoc.getPageCount();
                if (docPageCount === 1) {
                    return await lockedPlaceholderNextResponse(request);
                }
                const totalPageCount = pageCount ?? docPageCount;
                
                // Dynamic preview logic:
                // - 1-5 pages: Show only 1 page (to prevent free access to most content)
                // - 6+ pages: Show 2-3 pages (enough to evaluate quality without revealing too much)
                let PREVIEW_PAGE_COUNT: number;
                if (totalPageCount <= 5) {
                    PREVIEW_PAGE_COUNT = 1; // Short notes: only first page
                } else if (totalPageCount <= 10) {
                    PREVIEW_PAGE_COUNT = 2; // Medium notes: first 2 pages
                } else {
                    PREVIEW_PAGE_COUNT = 3; // Long notes: first 3 pages
                }
                
                PREVIEW_PAGE_COUNT = Math.min(PREVIEW_PAGE_COUNT, totalPageCount);
                
                if (totalPageCount > PREVIEW_PAGE_COUNT) {
                    // Create new PDF with only preview pages
                    const previewPdf = await PDFDocument.create();
                    const pagesToCopy = Array.from({ length: PREVIEW_PAGE_COUNT }, (_, i) => i);
                    const copiedPages = await previewPdf.copyPages(pdfDoc, pagesToCopy);
                    
                    copiedPages.forEach((page) => {
                        previewPdf.addPage(page);
                    });
                    
                    // Replace pdfDoc with preview version
                    const previewBytes = await previewPdf.save();
                    pdfDoc = await PDFDocument.load(previewBytes);
                }
            }

            // WATERMARK
            // Get user info or default
            // Helper to sanitize text for WinAnsi (Standard Fonts)
            const sanitizeForPdf = (text: string) => {
                return text
                    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
                    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
                    .replace(/ş/g, 's').replace(/Ş/g, 'S')
                    .replace(/ı/g, 'i').replace(/İ/g, 'I')
                    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
                    .replace(/ç/g, 'c').replace(/Ç/g, 'C');
            };

            const watermarkText = "OTLAK.COM.TR";
            const rawUserName = user
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || ""
                : "MISAFIR KULLANICI";
            const userName = sanitizeForPdf(rawUserName);

            const rawUserSub = user?.studentNumber || (session?.user?.email || "IP: " + (request.headers.get("x-forwarded-for") || "Gizli"));
            const userSub = sanitizeForPdf(rawUserSub);

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
                // For locked images, serve a placeholder instead of 403
                // This allows the UI to render "something" and avoids broken image icons.
                // The NoteViewer overlay will still appear on top of this.
                try {
                    const placeholderUrl = new URL('/locked-placeholder.svg', request.url);
                    const placeholderRes = await fetch(placeholderUrl);
                    const placeholderBuffer = await placeholderRes.arrayBuffer();

                    return new NextResponse(placeholderBuffer, {
                        headers: {
                            "Content-Type": "image/svg+xml",
                            "Cache-Control": "public, max-age=3600",
                        }
                    });
                } catch (e) {
                    console.error("Placeholder fetch error:", e);
                    return new NextResponse("Locked", { status: 403 });
                }
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
