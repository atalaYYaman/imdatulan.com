import { NextResponse } from "next/server";

/**
 * Returns the same SVG placeholder used for locked non-PDF files.
 * Caller must be in a Request context so absolute URL resolves for fetch.
 */
export async function lockedPlaceholderNextResponse(request: Request): Promise<NextResponse> {
    const placeholderUrl = new URL("/locked-placeholder.svg", request.url);
    const placeholderRes = await fetch(placeholderUrl);
    if (!placeholderRes.ok) {
        console.error("Placeholder fetch failed:", placeholderRes.statusText);
        return new NextResponse("Locked", { status: 403 });
    }

    const placeholderBuffer = await placeholderRes.arrayBuffer();
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    headers.set("Content-Type", "image/svg+xml");
    headers.set("X-Preview-Mode", "true");

    return new NextResponse(placeholderBuffer, {
        status: 200,
        headers,
    });
}
