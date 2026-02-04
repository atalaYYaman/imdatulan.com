import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from '@vercel/blob';
import { checkRateLimit } from "@/lib/rate-limit";
import { PDFDocument } from "pdf-lib";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const blobUrl = formData.get("blobUrl") as string | null
        const courseName = formData.get("courseName") as string
        const term = formData.get("term") as string
        const noteType = formData.get("noteType") as string
        const description = formData.get("description") as string
        const priceStr = formData.get("price") as string

        // --- VALIDATION (Sentinel) ---
        // 1. Rate Limit
        const limitCheck = await checkRateLimit(`upload_${session.user.email}`, 5, 3600); // 5 uploads per hour
        if (!limitCheck.success) {
            return NextResponse.json({ message: limitCheck.message }, { status: 429 });
        }

        // 2. Input Validation
        if ((!file && !blobUrl) || !courseName) {
            return NextResponse.json({ message: "Dosya ve Ders Adı zorunludur." }, { status: 400 })
        }

        let finalBlobUrl: string;

        // If blobUrl is provided (from direct blob upload), use it
        // Otherwise, upload the file directly (for small files < 4MB)
        if (blobUrl) {
            finalBlobUrl = blobUrl;
        } else if (file) {
            // File size validation for direct upload (small files only)
            const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (safe limit below 4.5MB)
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({ 
                    message: `Dosya boyutu çok büyük! Büyük dosyalar için lütfen tekrar deneyin. Seçilen dosya: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
                }, { status: 413 })
            }

            // Vercel Blob Storage (for small files)
            const blob = await put(file.name, file, {
                access: 'public',
                addRandomSuffix: true
            });
            finalBlobUrl = blob.url;
        } else {
            return NextResponse.json({ message: "Dosya bulunamadı." }, { status: 400 });
        }

        let price = priceStr ? parseInt(priceStr) : 1;
        // Validate Price using Schema manually (or just logic)
        // Schema: min 1, max 50
        if (price < 1) price = 1;
        if (price > 50) return NextResponse.json({ message: "Fiyat en fazla 50 süt olabilir." }, { status: 400 });

        // Extract page count from PDF if it's a PDF file
        let pageCount: number | null = null;
        try {
            const fileToCheck = file || (blobUrl ? await (await fetch(blobUrl)).blob() : null);
            if (fileToCheck) {
                const fileName = fileToCheck instanceof File ? fileToCheck.name : blobUrl || '';
                const isPdf = fileName.toLowerCase().endsWith('.pdf') || 
                             (fileToCheck instanceof File && fileToCheck.type === 'application/pdf');
                
                if (isPdf) {
                    const arrayBuffer = await (fileToCheck instanceof File ? fileToCheck.arrayBuffer() : fileToCheck.arrayBuffer());
                    const pdfDoc = await PDFDocument.load(arrayBuffer);
                    pageCount = pdfDoc.getPageCount();
                }
            }
        } catch (error) {
            console.error("Error extracting page count:", error);
            // Continue without page count if extraction fails
        }

        // DB Record
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

        const note = await prisma.note.create({
            data: {
                title: courseName,
                courseName: courseName,
                university: user.university || "Bilinmiyor",
                faculty: user.faculty || "Bilinmiyor",
                department: user.department || "Bilinmiyor",
                type: noteType,
                term: term,
                description: description,
                fileUrl: finalBlobUrl, // URL from Vercel Blob
                uploaderId: user.id,
                price: price,
                status: "PENDING",
                isAI: formData.get("isAI") === "true",
                pageCount: pageCount,
            }
        })

        // Credits are now awarded upon Admin Approval, not upload.

        return NextResponse.json({ message: "Upload successful", note }, { status: 201 })

    } catch (error) {
        console.error("Upload error details:", error)
        return NextResponse.json({
            message: "Internal Error: " + (error instanceof Error ? error.message : String(error))
        }, { status: 500 })
    }
}
