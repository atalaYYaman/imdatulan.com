
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from "@/lib/prisma";

export const generateVerificationToken = async (email: string) => {
    // 6 digit code
    const token = crypto.randomInt(100000, 999999).toString();
    // Expires in 15 mins (Extended from 2 mins for better UX, user asked for 2 mins but 15 is standard, sticking to plan though: 2 mins)
    // User requested 2 minutes strictly.
    const expires = new Date(new Date().getTime() + 2 * 60 * 1000);

    const existingToken = await prisma.verificationToken.findFirst({
        where: { email }
    });

    if (existingToken) {
        await prisma.verificationToken.delete({
            where: { id: existingToken.id }
        });
    }

    const verificationToken = await prisma.verificationToken.create({
        data: {
            email,
            token,
            expires
        }
    });

    return verificationToken;
}

export const generateTwoFactorToken = async (email: string) => {
    const token = crypto.randomInt(100000, 999999).toString();
    // 2 minutes for 2FA as well
    const expires = new Date(new Date().getTime() + 2 * 60 * 1000);

    const existingToken = await prisma.twoFactorToken.findFirst({
        where: { email }
    });

    if (existingToken) {
        await prisma.twoFactorToken.delete({
            where: { id: existingToken.id }
        });
    }

    const twoFactorToken = await prisma.twoFactorToken.create({
        data: {
            email,
            token,
            expires
        }
    });

    return twoFactorToken;
}
