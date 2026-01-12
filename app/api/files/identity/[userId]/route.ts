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
        const caller = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!caller) return new NextResponse("User not found", { status: 404 });

        // --- ACCESS CONTROL ---
        // 1. Owner can access their own ID
        // 2. Admin can access any ID
        const isOwner = caller.id === userId;
        const isAdmin = caller.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return new NextResponse("Forbidden: You cannot view this document.", { status: 403 });
        }

        // Fetch Target User to get the URL
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser || !targetUser.studentIdCardUrl) {
            return new NextResponse("Document not found", { status: 404 });
        }

        // --- PROXY STREAMING ---
        const fileResponse = await fetch(targetUser.studentIdCardUrl);
        if (!fileResponse.ok) {
            return new NextResponse("File fetch error", { status: 502 });
        }

        const headers = new Headers(fileResponse.headers);
        headers.set("Content-Disposition", `inline; filename="identity-${userId}.jpg"`);
        headers.set("Cache-Control", "private, max-age=3600");

        return new NextResponse(fileResponse.body, {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error("Identity File Proxy Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
