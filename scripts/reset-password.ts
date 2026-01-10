
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function resetPassword() {
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);

        await prisma.user.update({
            where: { email: 'atalayyaman771@gmail.com' },
            data: { password: hashedPassword }
        });

        console.log("Password updated for atalayyaman771@gmail.com to 123456");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
