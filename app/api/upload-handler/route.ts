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
    // Zero Trust: Always verify session first
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Zero Trust: Verify user exists in database
        const { prisma } = await import("@/lib/prisma");
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
        const limitCheck = await checkRateLimit(`upload_handler_${session.user.email}`, 10, 3600);
        if (!limitCheck.success) {
            return NextResponse.json({ message: limitCheck.message }, { status: 429 });
        }

        const body = (await request.json()) as HandleUploadBody;

        // Zero Trust: Validate request body
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
        }

        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Zero Trust: Validate pathname to prevent path traversal
                if (!pathname || typeof pathname !== 'string' || pathname.length > 255) {
                    throw new Error('Geçersiz dosya adı.');
                }

                // Zero Trust: Validate file extension (prevent executable files)
                const ext = pathname.split('.').pop()?.toLowerCase();
                const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
                
                if (!ext || !allowedExtensions.includes(ext)) {
                    throw new Error('Geçersiz dosya tipi. Sadece PDF, JPG ve PNG dosyaları kabul edilir.');
                }

                // Zero Trust: Sanitize filename (remove any path components)
                const sanitizedBasename = pathname.split('/').pop() || pathname;
                const sanitizedExt = sanitizedBasename.split('.').pop()?.toLowerCase() || ext;

                // Generate unique filename with UUID + timestamp to ensure uniqueness
                const timestamp = Date.now();
                const uniqueFilename = `${uuidv4()}-${timestamp}.${sanitizedExt}`;

                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
                    addRandomSuffix: true, // Extra safety: Vercel will add random suffix even if UUID collision occurs
                    maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
                    pathname: uniqueFilename,
                    tokenPayload: JSON.stringify({
                        userId: user.id, // Use database ID, not email
                        originalFilename: sanitizedBasename,
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
