import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { generateTwoFactorToken } from "./tokens"
import { sendEmail } from "./email"
import { rateLimit } from "./rate-limit"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null
                try {
                    const user = await prisma.user.findUnique({ where: { email: credentials.email } })

                    if (!user) {
                        console.log("Login Failed: User not found for email:", credentials.email);
                        return null
                    }

                    // Approval Check
                    if (user.role !== 'ADMIN' && user.approvalStatus !== 'APPROVED') {
                        throw new Error("Hesabınız henüz onaylanmamıştır. Lütfen onay bekleyiniz.");
                    }

                    if (user.approvalStatus === 'BANNED') {
                        throw new Error("Hesabınız yasaklanmıştır.");
                    }

                    if (!user.password) {
                        console.log("Login Failed: User has no password set (OAuth user?)");
                        return null
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password)

                    if (!isValid) {
                        console.log("Login Failed: Password mismatch for user:", credentials.email);
                        return null
                    }

                    // 2FA Trigger for Admin
                    if (user.role === 'ADMIN') {
                        // Rate Limit: 5 login attempts per 15 mins (2FA trigger)
                        const limitParams = await rateLimit(`2fa:${user.email}`, 5, 15 * 60 * 1000);
                        if (!limitParams.success) {
                            throw new Error("Çok fazla giriş denemesi. Lütfen 15 dakika bekleyin.");
                        }

                        const twoFactorToken = await generateTwoFactorToken(user.email);
                        await sendEmail({
                            to: user.email,
                            subject: "Güvenlik Kodunuz (2FA) | Otlak",
                            body: `Admin paneli giriş kodunuz: <b>${twoFactorToken.token}</b> <br> Bu kod 2 dakika geçerlidir.`
                        });

                        // We do not block login here. We let them in, but Middleware will catch them.
                        // We also need to ensure TwoFactorConfirmation is cleared if it exists from a previous session?
                        // Actually, confirmation is tied to User ID. If we want per-session, that's harder without DB session token.
                        // But since we use JWT, we can just delete it here to force re-verify.
                        await prisma.twoFactorConfirmation.deleteMany({
                            where: { userId: user.id }
                        });
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        credits: user.credits,
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Kullanıcı"
                    }
                } catch (error) {
                    console.error("Login Error:", error);
                    return null;
                }
            }
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.credits = (user as any).credits
                token.name = (user as any).name
                token.isTwoFactorVerified = false; // Default false
            }

            // Update session trigger (e.g. when credits change)
            if (trigger === "update" && session) {
                if (session.credits !== undefined) token.credits = session.credits;
                if (session.name) token.name = session.name;
            }

            // Always fetch fresh credits and name from DB to stay compassionate with server actions
            // AND check 2FA status
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email as string },
                    select: {
                        id: true,
                        credits: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        twoFactorConfirmation: true
                    }
                });

                if (dbUser) {
                    token.credits = dbUser.credits;
                    const fullName = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim();
                    if (fullName) {
                        token.name = fullName;
                    }

                    // 2FA Check
                    if (dbUser.role === 'ADMIN') {
                        if (dbUser.twoFactorConfirmation) {
                            token.isTwoFactorVerified = true;
                        } else {
                            token.isTwoFactorVerified = false;
                        }
                    } else {
                        // Regular users don't need 2FA (yet)
                        token.isTwoFactorVerified = true;
                    }
                }
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = (token as any).id;
                (session.user as any).role = (token as any).role;
                (session.user as any).credits = (token as any).credits;
                // name is already handled by default but let's ensure it comes from our logic
                session.user.name = token.name as string;
                (session.user as any).isTwoFactorVerified = (token as any).isTwoFactorVerified;
            }
            return session
        }
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error', // For errors
    }
}
