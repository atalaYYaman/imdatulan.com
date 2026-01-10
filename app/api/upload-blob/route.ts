import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename || !request.body) {
        return NextResponse.json({ message: "No filename or body" }, { status: 400 });
    }

    try {
        // Sanitize filename to simple ASCII to avoid blob storage issues
        // Keep extension, replace rest with timestamp + simple chars
        const ext = filename.split('.').pop();
        const simpleName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const sanitizedFilename = `${Date.now()}-${simpleName}`;

        const blob = await put(sanitizedFilename, request.body, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error: any) {
        console.error("Blob Upload Error:", error);
        return NextResponse.json({ message: "Upload failed", error: error.message }, { status: 500 });
    }
}
