import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from '@vercel/blob';
import { checkRateLimit } from "@/lib/rate-limit";
import { v4 as uuidv4 } from 'uuid';

/**
 * Direct blob upload endpoint for large files (up to 25MB)
 * IMPORTANT: This endpoint still has the 4.5MB serverless function body limit.
 * For files > 4MB, we need to use client-side direct upload to Vercel Blob.
 * 
 * This endpoint is kept for backward compatibility with small files.
 * Large files should use the client-side upload flow with progress tracking.
 */
export async function POST(req: Request) {
    // Zero Trust: Always verify session first
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Zero Trust: Verify user exists in database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, approvalStatus: true }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Zero Trust: Check user approval status
        if (user.approvalStatus === 'BANNED' || user.approvalStatus === 'REJECTED') {
            return NextResponse.json({ message: "Account not authorized" }, { status: 403 });
        }

        // Rate limit check
        const limitCheck = await checkRateLimit(`upload_blob_${session.user.email}`, 5, 3600);
        if (!limitCheck.success) {
            return NextResponse.json({ message: limitCheck.message }, { status: 429 });
        }

        // Check content-length header first to avoid reading large bodies
        const contentLength = req.headers.get("content-length");
        const MAX_FUNCTION_SIZE = 4 * 1024 * 1024; // 4MB - safe limit below 4.5MB
        if (contentLength && parseInt(contentLength) > MAX_FUNCTION_SIZE) {
            return NextResponse.json({
                message: "Bu dosya çok büyük. Lütfen client-side upload kullanın."
            }, { status: 413 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "Dosya bulunamadı." }, { status: 400 });
        }

        // File size validation (25MB for Vercel Pro, but function limit is 4.5MB)
        const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                message: `Dosya boyutu çok büyük! Maksimum 25MB yükleyebilirsiniz. Seçilen dosya: ${(file.size / 1024 / 1024).toFixed(2)}MB`
            }, { status: 413 });
        }

        // File type validation using magic bytes (read only first 4 bytes)
        const firstBytes = file.slice(0, 4);
        const headerArray = await firstBytes.arrayBuffer();
        const header = Array.from(new Uint8Array(headerArray))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        let isValid = false;
        // PDF: 25 50 44 46 (%PDF)
        if (header.startsWith('25504446')) isValid = true;
        // JPEG: FF D8 FF
        else if (header.startsWith('ffd8ff')) isValid = true;
        // PNG: 89 50 4E 47
        else if (header.startsWith('89504e47')) isValid = true;

        if (!isValid) {
            return NextResponse.json({
                message: "Geçersiz dosya tipi. Sadece PDF, JPG ve PNG dosyaları kabul edilir."
            }, { status: 400 });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || "bin";
        const uniqueFilename = `${uuidv4()}.${ext}`;

        // Upload to Vercel Blob
        // Note: For files > 4MB, this will fail due to function body limit
        // Client should use direct blob upload instead
        const blob = await put(uniqueFilename, file, {
            access: 'public',
        });

        return NextResponse.json({
            url: blob.url,
            filename: uniqueFilename,
            size: file.size
        }, { status: 200 });

    } catch (error) {
        console.error("Direct blob upload error:", error);
        // Check if it's a payload too large error
        if (error instanceof Error && error.message.includes('payload') || error instanceof Error && error.message.includes('too large')) {
            return NextResponse.json({
                message: "Dosya çok büyük. Lütfen client-side upload kullanın veya dosyayı küçültün."
            }, { status: 413 });
        }
        return NextResponse.json({
            message: "Yükleme hatası: " + (error instanceof Error ? error.message : String(error))
        }, { status: 500 });
    }
}
