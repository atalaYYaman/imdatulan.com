
// Simple in-memory rate limiter
// For production, use Redis or similar (KV).
const trackers: Record<string, { count: number; expiresAt: number }> = {};

export async function rateLimit(identifier: string, limit: number = 5, windowKm: number = 15 * 60 * 1000) {
    const now = Date.now();
    const key = identifier;

    if (!trackers[key]) {
        trackers[key] = { count: 1, expiresAt: now + windowKm };
        return { success: true };
    }

    const tracker = trackers[key];

    if (now > tracker.expiresAt) {
        trackers[key] = { count: 1, expiresAt: now + windowKm };
        return { success: true };
    }

    if (tracker.count >= limit) {
        return { success: false };
    }

    tracker.count++;
    return { success: true };
}
