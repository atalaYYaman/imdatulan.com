import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ userId: string }> }) {
    const params = await props.params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId } = params;

    try {
        console.log(`[IdentityProxy] Request for userId: ${userId}`);
        const caller = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!caller) {
            console.log("[IdentityProxy] Caller not found in DB");
            return new NextResponse("User not found", { status: 404 });
        }

        // --- ACCESS CONTROL ---
        // 1. Owner can access their own ID
        // 2. Admin can access any ID
        const isOwner = caller.id === userId;
        const isAdmin = caller.role === 'ADMIN';
        console.log(`[IdentityProxy] Access Check - Caller: ${caller.id}, Target: ${userId}, IsAdmin: ${isAdmin}, IsOwner: ${isOwner}`);

        if (!isOwner && !isAdmin) {
            console.log("[IdentityProxy] Access Denied");
            return new NextResponse("Forbidden: You cannot view this document.", { status: 403 });
        }

        // Fetch Target User to get the URL
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser || !targetUser.studentIdCardUrl) {
            console.log(`[IdentityProxy] Target user or ID card URL missing. User: ${!!targetUser}, Url: ${targetUser?.studentIdCardUrl}`);
            return new NextResponse("Document not found", { status: 404 });
        }

        console.log(`[IdentityProxy] Fetching from Blob URL: ${targetUser.studentIdCardUrl}`);

        // --- PROXY STREAMING ---
        const fileResponse = await fetch(targetUser.studentIdCardUrl);
        if (!fileResponse.ok) {
            console.error(`[IdentityProxy] Upstream Fetch Failed: ${fileResponse.status} ${fileResponse.statusText}`);
            return new NextResponse("File fetch error", { status: 502 });
        }

        console.log("[IdentityProxy] Success. Streaming response.");
        const headers = new Headers(fileResponse.headers);
        headers.set("Content-Disposition", `inline; filename="identity-${userId}.jpg"`);
        headers.set("Cache-Control", "private, max-age=3600");

        return new NextResponse(fileResponse.body, {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error("[IdentityProxy] Unexpected Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
