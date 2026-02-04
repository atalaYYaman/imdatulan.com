import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle client-side blob uploads
 * This endpoint handles the token exchange for direct client-to-blob uploads
 * Files are uploaded directly from client to Vercel Blob, bypassing serverless function body limits
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Rate limit check
        const limitCheck = await checkRateLimit(`upload_handler_${session.user.email}`, 10, 3600);
        if (!limitCheck.success) {
            return NextResponse.json({ message: limitCheck.message }, { status: 429 });
        }

        const body = (await request.json()) as HandleUploadBody;

        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Validate file extension
                const ext = pathname.split('.').pop()?.toLowerCase();
                const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
                
                if (!ext || !allowedExtensions.includes(ext)) {
                    throw new Error('Geçersiz dosya tipi. Sadece PDF, JPG ve PNG dosyaları kabul edilir.');
                }

                // Generate unique filename
                const uniqueFilename = `${uuidv4()}.${ext}`;

                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
                    addRandomSuffix: false, // We already added UUID
                    maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
                    pathname: uniqueFilename,
                    tokenPayload: JSON.stringify({
                        userId: session.user?.email,
                        originalFilename: pathname,
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Upload completed successfully
                // tokenPayload contains the data we set in onBeforeGenerateToken
                console.log('Upload completed:', blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error("Upload handler error:", error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : "Yükleme hatası oluştu" 
            },
            { status: 500 }
        );
    }
}
