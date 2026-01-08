const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding products...');

    // Clear existing products to avoid duplicates if re-run (optional but safe)
    // await prisma.product.deleteMany({}); 

    const products = [
        {
            name: 'Sanal Kahve ☕',
            description: 'Yorucu bir günün ardından kendine bir sanal kahve ısmarla. Motivasyonunu artır!',
            price: 10,
            imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
            stock: null
        },
        {
            name: 'Kantin İndirim Kuponu',
            description: 'Anlaşmalı kampüs kafelerinde geçerli %20 indirim kodu.',
            price: 50,
            imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=600&auto=format&fit=crop',
            stock: 20
        },
        {
            name: 'Premium Üyelik (1 Ay)',
            description: 'Tüm notlara sınırsız erişim ve reklamsız deneyim. (Yakında aktif)',
            price: 200,
            imageUrl: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=600&auto=format&fit=crop',
            stock: null
        },
        {
            name: 'Özel Not Defteri',
            description: 'İmdatulan logolu, kaliteli kağıtlı not defteri. Kargo bizden!',
            price: 500,
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop',
            stock: 5
        }
    ];

    for (const p of products) {
        await prisma.product.create({
            data: p
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
