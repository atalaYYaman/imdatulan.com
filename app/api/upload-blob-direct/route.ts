import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { put } from '@vercel/blob';
import { checkRateLimit } from "@/lib/rate-limit";
import { v4 as uuidv4 } from 'uuid';

/**
 * Direct blob upload endpoint for large files (up to 25MB)
 * This endpoint uploads files directly to Vercel Blob without going through
 * the serverless function body, avoiding the 4.5MB limit.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Rate limit check
        const limitCheck = await checkRateLimit(`upload_blob_${session.user.email}`, 5, 3600);
        if (!limitCheck.success) {
            return NextResponse.json({ message: limitCheck.message }, { status: 429 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "Dosya bulunamadı." }, { status: 400 });
        }

        // File size validation (25MB for Vercel Pro)
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
        // Vercel Blob's put() accepts File objects and handles streaming internally
        // This avoids loading the entire file into memory, bypassing serverless function body limits
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
        return NextResponse.json({
            message: "Yükleme hatası: " + (error instanceof Error ? error.message : String(error))
        }, { status: 500 });
    }
}
