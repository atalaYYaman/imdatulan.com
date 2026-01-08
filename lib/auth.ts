import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

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

                    if (!user.password) {
                        console.log("Login Failed: User has no password set (OAuth user?)");
                        return null
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password)

                    if (!isValid) {
                        console.log("Login Failed: Password mismatch for user:", credentials.email);
                        return null
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
            }

            // Update session trigger (e.g. when credits change)
            if (trigger === "update" && session) {
                if (session.credits !== undefined) token.credits = session.credits;
                if (session.name) token.name = session.name;
            }

            // Always fetch fresh credits and name from DB to stay compassionate with server actions
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email as string },
                    select: {
                        credits: true,
                        firstName: true,
                        lastName: true
                    }
                });
                if (dbUser) {
                    token.credits = dbUser.credits;
                    const fullName = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim();
                    if (fullName) {
                        token.name = fullName;
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
            }
            return session
        }
    },
    pages: {
        signIn: '/auth/signin',
    }
}
