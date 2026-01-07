const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotes() {
    try {
        const notes = await prisma.note.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log("Son 5 Not:");
        console.log(JSON.stringify(notes, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotes();
