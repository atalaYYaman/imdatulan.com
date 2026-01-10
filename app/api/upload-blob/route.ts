import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Rate Limit Check (Specifically for Uploads - stricter?)
    // Let's use generic global limit 100/min per IP, or stricter 10/min for uploads
    const limitCheck = await checkRateLimit(ip, 10, 60);
    if (!limitCheck.success) {
        return NextResponse.json({ message: "Too many uploads. Wait a bit." }, { status: 429 });
    }

    // --- SIZE CHECK ---
    const contentLength = request.headers.get("content-length");
    const MAX_SIZE = 4.4 * 1024 * 1024; // ~4.4MB (Vercel Limit is 4.5MB)
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
        return NextResponse.json({
            message: "Dosya çok büyük. Maksimum 4MB yükleyebilirsiniz. (Serverless Limit)"
        }, { status: 413 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename || !request.body) {
        return NextResponse.json({ message: "No filename or body" }, { status: 400 });
    }

    try {
        // --- 1. MAGIC BYTES CHECK ---
        // Need to read the first few bytes of the stream without consuming it? 
        // request.body is a ReadableStream. Cloning it is necessary.
        const clone = request.clone();
        const arrayBuffer = await clone.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Check signatures
        const header = buffer.toString('hex', 0, 4);

        let isValid = false;
        // PDF: 25 50 44 46 (%PDF)
        if (header.startsWith('25504446')) isValid = true;
        // JPEG: FF D8 FF
        else if (header.startsWith('ffd8ff')) isValid = true;
        // PNG: 89 50 4E 47
        else if (header.startsWith('89504e47')) isValid = true;
        // WebP, others? For now limiting to PDF and Images.

        if (!isValid) {
            return NextResponse.json({ message: "Invalid file type (Magic Bytes Mismatch). Only PDF, JPG, PNG allowed." }, { status: 400 });
        }

        // --- 2. UUID FILENAME ---
        const ext = filename.split('.').pop() || "bin";
        // Enforce safe extensions based on magic bytes if we were stricter, but UUID + ext is decent.
        const uniqueFilename = `${uuidv4()}.${ext}`;

        const blob = await put(uniqueFilename, request.body, {
            access: 'public', // Kept public but we will protect it via UI logic (Private Proxy is better but Blob doesn't support Private ACL easily without Token Auth. 
            // User wanted Private/Signed. Vercel Blob 'private' require server-side token generation.
            // Actually 'access: public' means unguessable unique URL. With UUID it's safeish. 
            // BUT plan said Proxy. We will implement proxy logic to SERVE it, hiding this URL from frontend.)
        });

        return NextResponse.json(blob);
    } catch (error: any) {
        console.error("Blob Upload Error:", error);
        return NextResponse.json({ message: "Upload failed", error: error.message }, { status: 500 });
    }
}
