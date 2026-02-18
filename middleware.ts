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
            // /notes ve /api/download: sadece giriş yapmış kullanıcılar erişebilir (Zero Trust)
            authorized: ({ req, token }) => {
                const path = req.nextUrl.pathname;
                if (path.startsWith("/notes") || path.startsWith("/api/download")) return !!token;
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        "/admin/:path*",
        "/partner/:path*",
        "/profile/:path*",
        "/notes",
        "/notes/:path*",
        "/note/:path*",
        "/chat/:path*",
        "/upload/:path*",
        "/feedback/:path*",
        "/updates/:path*",
        "/store/:path*",
        "/top-noder/:path*",
        "/support/:path*",
        "/api/download/:path*",
    ],
};
