import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('123123', 10)

    const users = [
        {
            email: 'test1@gmail.com',
            password,
            firstName: 'Test',
            lastName: 'Bir',
            university: 'Necmettin Erbakan Üniversitesi',
            faculty: 'Mühendislik Fakültesi',
            department: 'Bilgisayar Mühendisliği',
            approvalStatus: 'APPROVED',
            credits: 10
        },
        {
            email: 'test2@gmail.com',
            password,
            firstName: 'Test',
            lastName: 'İki',
            university: 'Necmettin Erbakan Üniversitesi',
            faculty: 'Mühendislik Fakültesi',
            department: 'Bilgisayar Mühendisliği',
            approvalStatus: 'APPROVED',
            credits: 10
        },
        {
            email: 'test3@gmail.com',
            password,
            firstName: 'Test',
            lastName: 'Üç',
            university: 'Necmettin Erbakan Üniversitesi',
            faculty: 'Mühendislik Fakültesi',
            department: 'Bilgisayar Mühendisliği',
            approvalStatus: 'APPROVED',
            credits: 10
        }
    ]

    console.log('Test kullanıcıları oluşturuluyor...')

    for (const u of users) {
        // Upsert ensures we don't crash if they already exist (though db was reset)
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: u
        })
        console.log(`Oluşturuldu: ${user.email}`)
    }

    console.log('İşlem tamamlandı.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
