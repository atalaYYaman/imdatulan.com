import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
    try {
        console.log('Clearing existing users...');
        await prisma.user.deleteMany({});

        const passwordHash = await bcrypt.hash('123456', 10);

        const users = [
            // 4 Approved Users
            { email: 'user1@example.com', firstName: 'Ahmet', lastName: 'Yilmaz', role: 'USER', approvalStatus: 'APPROVED' },
            { email: 'user2@example.com', firstName: 'Ayse', lastName: 'Demir', role: 'USER', approvalStatus: 'APPROVED' },
            { email: 'user3@example.com', firstName: 'Mehmet', lastName: 'Kaya', role: 'USER', approvalStatus: 'APPROVED' },
            { email: 'user4@example.com', firstName: 'Fatma', lastName: 'Celik', role: 'USER', approvalStatus: 'APPROVED' },
            // 1 Pending User
            { email: 'pending@example.com', firstName: 'Bekleyen', lastName: 'Ogrenci', role: 'USER', approvalStatus: 'PENDING' },
            // 1 Rejected User
            { email: 'rejected@example.com', firstName: 'Red', lastName: 'Kullanici', role: 'USER', approvalStatus: 'REJECTED', rejectionCount: 1, rejectionReason: 'Belgeler eksik.' }
        ];

        console.log('Seeding users...');

        let i = 0;
        for (const u of users) {
            i++;
            // Generate valid-looking unique IDs
            // TC: 11 + 9 digits. We use '00000000' + i
            const uniqueSuffix = i.toString().padStart(9, '0');
            const studentSuffix = i.toString().padStart(7, '0');

            await prisma.user.upsert({
                where: { email: u.email },
                update: {
                    // Updating password in case it changed
                    password: passwordHash,
                    approvalStatus: u.approvalStatus,
                    rejectionCount: u.rejectionCount || 0,
                },
                create: {
                    email: u.email,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    password: passwordHash,
                    role: u.role,
                    approvalStatus: u.approvalStatus,
                    rejectionCount: u.rejectionCount || 0,
                    rejectionReason: u.rejectionReason,
                    marketingConsent: true,
                    // Unique fields handling:
                    studentNumber: u.approvalStatus === 'REJECTED' ? null : `2024${studentSuffix}`,
                    tcIdentityNo: u.approvalStatus === 'REJECTED' ? null : `11${uniqueSuffix}`
                }
            });
            console.log(`Created/Updated: ${u.email}`);
        }

        console.log('Seeding complete.');

    } catch (e) {
        console.error('Error seeding users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedUsers();
