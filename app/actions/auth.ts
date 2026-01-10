'use server';

import { prisma } from "@/lib/prisma";
import { generateVerificationToken, generateTwoFactorToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export const resetPassword = async (token: string, email: string, newPassword: string) => {
    try {
        const existingToken = await prisma.verificationToken.findFirst({
            where: { token, email }
        });

        if (!existingToken) {
            return { success: false, message: "Geçersiz veya süresi dolmuş kod." };
        }

        const hasExpired = new Date(existingToken.expires) < new Date();
        if (hasExpired) {
            return { success: false, message: "Kodun süresi dolmuş." };
        }

        const passwordCheck = validatePassword(newPassword);
        if (!passwordCheck.isValid) {
            return { success: false, message: passwordCheck.message };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        await prisma.verificationToken.delete({
            where: { id: existingToken.id }
        });

        return { success: true, message: "Şifreniz başarıyla değiştirildi." };

    } catch (error) {
        return { success: false, message: "Bir hata oluştu." };
    }
};


// ... existing imports ...


// ... existing imports ...

export const sendPasswordResetEmail = async (email: string) => {
    // Rate Limit: 3 requests per 10 minutes (600 seconds)
    const limitParams = await checkRateLimit(`reset:${email}`, 3, 600);
    if (!limitParams.success) {
        return { success: false, message: "Çok fazla istek gönderdiniz. Lütfen biraz bekleyin." };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, message: "Kullanıcı bulunamadı." };

    const token = await generateVerificationToken(email);
    // ...

    await sendEmail({
        to: email,
        subject: "Şifre Sıfırlama Kodu | Otlak",
        body: `Şifrenizi sıfırlamak için kullanmanız gereken kod: <b>${token.token}</b> <br> Bu kod 2 dakika geçerlidir.`
    });

    return { success: true, message: "Kod gönderildi." };
};

export const verifyTwoFactor = async (token: string, email: string) => {
    try {
        const existingToken = await prisma.twoFactorToken.findFirst({
            where: { token, email }
        });

        if (!existingToken) {
            return { success: false, message: "Geçersiz kod." };
        }

        const hasExpired = new Date(existingToken.expires) < new Date();
        if (hasExpired) {
            return { success: false, message: "Kodun süresi dolmuş." };
        }

        await prisma.twoFactorToken.delete({
            where: { id: existingToken.id }
        });

        // Find user to get ID
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return { success: false, message: "User not found" };

        // Create confirmation
        const existingConfirmation = await prisma.twoFactorConfirmation.findUnique({
            where: { userId: user.id }
        });

        if (existingConfirmation) {
            await prisma.twoFactorConfirmation.delete({
                where: { id: existingConfirmation.id }
            });
        }

        await prisma.twoFactorConfirmation.create({
            data: { userId: user.id }
        });

        return { success: true, message: "Doğrulama başarılı." };

    } catch (error) {
        return { success: false, message: "Bir hata oluştu." };
    }
}

export const sendTwoFactorEmail = async (email: string) => {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return { success: false, message: "Kullanıcı bulunamadı." };

        if (user.role !== 'ADMIN') {
            return { success: false, message: "Yetkisiz işlem." };
        }

        // Rate Limit: 3 requests per 5 mins (300 seconds)
        const limitParams = await checkRateLimit(`2fa-req:${email}`, 3, 300);
        if (!limitParams.success) {
            return { success: false, message: "Çok fazla istek. Lütfen bekleyin." };
        }

        const twoFactorToken = await generateTwoFactorToken(email);

        await sendEmail({
            to: email,
            subject: "Güvenlik Kodunuz (2FA) | Otlak",
            body: `Admin paneli giriş kodunuz: <b>${twoFactorToken.token}</b> <br> Bu kod 2 dakika geçerlidir.`
        });

        return { success: true, message: "Kod gönderildi." };
    } catch (error) {
        return { success: false, message: "Hata oluştu." };
    }
};
