
const { PrismaClient } = require('@prisma/client');
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
                password: true // checking if hash exists, don't print full hash if not needed, but for debug it's fine to see it's a string
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
