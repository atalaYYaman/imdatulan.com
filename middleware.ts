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

        // Other protections can be added here
        return NextResponse.next();
    },
    {
        callbacks: {
            // Authorized if token exists. Logic above handles role checks.
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*"],
};
