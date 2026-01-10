import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                email: {
                    in: ['atalayyaman771@gmail.com', 'atalayyaman774@gmail.com']
                }
            },
            select: {
                id: true,
                email: true,
                approvalStatus: true,
                role: true,
                password: true
            }
        });
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
