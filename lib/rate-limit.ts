import { prisma } from "@/lib/prisma";

export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
    const now = new Date();
    const windowMs = windowSeconds * 1000;

    try {
        // Transaction to ensure atomicity is tricky with upsert logic regarding expiration reset.
        // But we can simplify: 
        // 1. Get current
        // 2. If not exist or expired -> Set to 1
        // 3. Else -> Increment

        // Better yet, use upsert with a smart update or verify after fetch.
        // Prisma doesn't support conditional update in upsert easily for "if expired then reset".
        // Let's do a findUnique then update/create.

        const record = await prisma.rateLimit.findUnique({
            where: { key }
        });

        if (!record || record.expiresAt < now) {
            // Create or Reset
            const expires = new Date(now.getTime() + windowMs);
            await prisma.rateLimit.upsert({
                where: { key },
                create: { key, count: 1, expiresAt: expires },
                update: { count: 1, expiresAt: expires }
            });
            return { success: true };
        }

        // Check limit
        if (record.count >= limit) {
            // Block
            // Check if we should ban (IP blocking logic). 
            // Providing "remaining" info might be useful.
            return { success: false, retryAfter: record.expiresAt };
        }

        // Increment
        await prisma.rateLimit.update({
            where: { key },
            data: { count: { increment: 1 } }
        });

        return { success: true };

    } catch (error) {
        console.error("Rate Limit Error:", error);
        // Fail open or closed? Closed for security.
        return { success: false }; // Conservative approach
    }
}
