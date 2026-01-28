import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Admin Route Protection
        if (path.startsWith("/admin")) {
            // Check if user is admin
            if (token?.role !== 'ADMIN') {
                return NextResponse.redirect(new URL("/", req.url));
            }

            // Check ID 2FA is verified (for Admins)
            if (!(token as any)?.isTwoFactorVerified) {
                return NextResponse.redirect(new URL("/auth/verify-email", req.url));
            }
        }

        // Partner Route Restrictions (UI hides links, backend enforces)
        // Partner can only access: "/", "/store", "/updates", "/partner/*" and auth pages.
        if (token?.role === 'PARTNER') {
            const allowed =
                path === "/" ||
                path.startsWith("/store") ||
                path.startsWith("/updates") ||
                path.startsWith("/partner") ||
                path.startsWith("/auth");

            if (!allowed) {
                return NextResponse.redirect(new URL("/", req.url));
            }
        }

        // Other protections can be added here
        return NextResponse.next();
    },
    {
        callbacks: {
            // Allow public access; apply role checks only when token exists.
            authorized: () => true,
        },
    }
);

export const config = {
    matcher: [
        "/admin/:path*",
        "/partner/:path*",
        "/profile/:path*",
        "/notes/:path*",
        "/note/:path*",
        "/chat/:path*",
        "/upload/:path*",
        "/feedback/:path*",
        "/updates/:path*",
        "/store/:path*",
        "/top-noder/:path*",
        "/support/:path*",
    ],
};
