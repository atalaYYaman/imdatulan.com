const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetail() {
    const noteId = "cmk45vrvp0001phk38no90lve";
    try {
        console.log("Sorgu başlıyor...");
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        university: true,
                        department: true,
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
        console.log("Sonuç:");
        console.log(JSON.stringify(note, null, 2));
    } catch (e) {
        console.error("HATA:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDetail();
