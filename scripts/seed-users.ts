import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
    try {
        console.log('Clearing existing users...');
        await prisma.user.deleteMany({});

        // 1. Create Admins
        console.log('Creating Admin users...');
        const adminPassword1 = await bcrypt.hash('AdminPaswd!123', 10);
        const adminPassword2 = await bcrypt.hash('SecureAdmin!987', 10);

        await prisma.user.create({
            data: {
                email: 'admin1@imdatulan.com',
                firstName: 'Süper',
                lastName: 'Admin',
                role: 'ADMIN',
                approvalStatus: 'APPROVED',
                password: adminPassword1,
                marketingConsent: true,
                tcIdentityNo: '11111111111',
                studentNumber: '11111111'
            }
        });

        await prisma.user.create({
            data: {
                email: 'admin2@imdatulan.com',
                firstName: 'Yedek',
                lastName: 'Admin',
                role: 'ADMIN',
                approvalStatus: 'APPROVED',
                password: adminPassword2,
                marketingConsent: true,
                tcIdentityNo: '22222222222',
                studentNumber: '22222222'
            }
        });
        console.log('Admins created.');

        // 2. Create Stock Users for Departments
        console.log('Fetching faculties and departments...');

        // Find relevant faculties
        const targetFaculties = await prisma.faculty.findMany({
            where: {
                OR: [
                    { name: { contains: 'Mühendislik', mode: 'insensitive' } },
                    { name: { contains: 'Hukuk', mode: 'insensitive' } },
                    { name: { contains: 'Tıp', mode: 'insensitive' } }
                ]
            },
            include: {
                departments: true
            }
        });

        const commonPassword = await bcrypt.hash('ImdatUlan!2025', 10);

        console.log(`Found ${targetFaculties.length} faculties. Creating stock users...`);

        let userCount = 0;
        let uniqueCounter = 1000; // For unique fields

        for (const faculty of targetFaculties) {
            for (const dept of faculty.departments) {
                userCount++;
                uniqueCounter++;

                // Sanitize department name for email
                // Replace spaces and special chars, keep it simple
                // e.g. "Bilgisayar Mühendisliği" -> "bilgisayar-muhendisligi"
                const sanitizedDept = dept.name
                    .toLowerCase()
                    .replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u')
                    .replace(/ş/g, 's')
                    .replace(/ı/g, 'i')
                    .replace(/ö/g, 'o')
                    .replace(/ç/g, 'c')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-') // multiple dashes to one
                    .replace(/^-|-$/g, ''); // trim dashes

                const email = `not.${sanitizedDept}.${uniqueCounter}@imdatulan.com`; // Added unique counter to email just in case of duplicate dept names across faculties (though rare for exact same sanitized string, 'insaat-muhendisligi' might happen twice if different faculties? Unlikely but safe)

                await prisma.user.create({
                    data: {
                        email: email,
                        firstName: dept.name,
                        lastName: 'İneği',
                        role: 'USER',
                        approvalStatus: 'APPROVED',
                        password: commonPassword,
                        marketingConsent: true,

                        // Academic Info
                        university: 'Necmettin Erbakan Üniversitesi', // Defaulting to NEU as per context
                        faculty: faculty.name,
                        department: dept.name,

                        // Identity (Dummy but Unique)
                        // TC: 11 digits
                        tcIdentityNo: `99${uniqueCounter.toString().padStart(9, '0')}`,
                        // Student No: Usually 9-10 digits
                        studentNumber: `2025${uniqueCounter.toString().padStart(5, '0')}`
                    }
                });
                console.log(`Created stock user: ${email} for ${dept.name}`);
            }
        }

        console.log(`Seeding complete. Created 2 Admins and ${userCount} Stock Users.`);

    } catch (e) {
        console.error('Error seeding users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedUsers();
