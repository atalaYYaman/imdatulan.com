import { prisma } from "@/lib/prisma";

export type RateLimitResult =
    | { success: true }
    | { success: false; retryAfter?: Date; message?: string };

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = new Date();
    const windowMs = windowSeconds * 1000;

    try {
        const record = await prisma.rateLimit.findUnique({
            where: { key }
        });

        if (!record || record.expiresAt < now) {
            // Create or Reset (Expired)
            // Note: Upsert is safe for concurrency here mostly because we just reset if expired.
            // If two requests come at exact same ms for expired, both might set to 1. That's acceptable.
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
            const remainingSeconds = Math.ceil((record.expiresAt.getTime() - now.getTime()) / 1000);
            return {
                success: false,
                retryAfter: record.expiresAt,
                message: `Çok fazla istek. Lütfen ${remainingSeconds} saniye bekleyin.`
            };
        }

        // Increment
        await prisma.rateLimit.update({
            where: { key },
            data: { count: { increment: 1 } }
        });

        return { success: true };

    } catch (error) {
        console.error("Rate Limit Error:", error);
        // Fail Closed (Secure) - If DB fails, block to prevent abuse exploitation during outage?
        // Or Fail Open (Usable) - If DB fails, allow user?
        // For security context ("Sentinel"), we prefer Fail Closed or just Log.
        // Let's Fail Closed but slightly lenient on ephemeral errors might be better for UX?
        // No, "Sentinel" says: "Güven zayıflıktır." -> Fail Closed.
        return { success: false, message: "Sistem yoğunluğu, lütfen bekleyin." };
    }
}
