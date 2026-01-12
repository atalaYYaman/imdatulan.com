
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    const userCount = await prisma.user.count();
    const noteCount = await prisma.note.count();
    const uniCount = await prisma.university.count();
    const facultyCount = await prisma.faculty.count();

    console.log(`Users: ${userCount} (Expected: 0)`);
    console.log(`Notes: ${noteCount} (Expected: 0)`);
    console.log(`Universities: ${uniCount} (Expected: >0)`);
    console.log(`Faculties: ${facultyCount} (Expected: >0)`);

    if (userCount === 0 && noteCount === 0 && uniCount > 0) {
        console.log('✅ Verification Passed: System is clean and ready.');
    } else {
        console.error('❌ Verification Failed: Data mismatch.');
        process.exit(1);
    }
}

verify().finally(() => prisma.$disconnect());
