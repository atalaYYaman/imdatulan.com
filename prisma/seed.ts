
import { PrismaClient } from '@prisma/client'
import { ACADEMIC_TREE, UNIVERSITY_NAMES } from '../lib/academicMaster'

const prisma = new PrismaClient()

async function main() {
    console.log(`Start seeding ...`)

    for (const name of UNIVERSITY_NAMES) {
        const u = await prisma.university.upsert({
            where: { name },
            update: { isActive: true },
            create: { name, isActive: true },
        })
        console.log(`University: ${u.name} (active)`)
    }

    for (const { faculty: facultyName, departments } of ACADEMIC_TREE) {
        const faculty = await prisma.faculty.upsert({
            where: { name: facultyName },
            update: {},
            create: { name: facultyName },
        })

        const existing = await prisma.department.findMany({
            where: { facultyId: faculty.id },
            select: { name: true },
        })
        const existingNames = new Set(existing.map((d) => d.name))

        for (const deptName of departments) {
            if (existingNames.has(deptName)) continue
            await prisma.department.create({
                data: { name: deptName, facultyId: faculty.id },
            })
        }
    }
    console.log(`Seeded ${ACADEMIC_TREE.length} faculties and departments`)

    const store = await prisma.store.upsert({
        where: { id: "store-demo-01" },
        update: {},
        create: {
            id: "store-demo-01",
            name: "Kampüs Kırtasiye",
            location: "Kütüphane Yanı",
            contactInfo: "0555 123 45 67",
            isActive: true
        }
    });

    await prisma.storeProduct.upsert({
        where: { id: "prod-tea-01" },
        update: {},
        create: {
            id: "prod-tea-01",
            storeId: store.id,
            title: "Bir Bardak Çay",
            description: "Sıcak bir mola için.",
            price: 5,
            stock: 100,
            type: "COUPON",
            isActive: true
        }
    });

    console.log(`Seeded Store: ${store.name}`);
    console.log(`Seeding finished.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
