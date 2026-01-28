import { prisma } from '@/lib/prisma';
import AdminStoreDetailClient from '@/components/admin/AdminStoreDetailClient';
import { notFound } from 'next/navigation';

interface PageProps {
    params: {
        storeId: string;
    };
}

export const dynamic = 'force-dynamic';

export default async function AdminStoreDetailPage({ params }: PageProps) {
    const store = await prisma.store.findUnique({
        where: { id: params.storeId },
        include: {
            products: {
                orderBy: { createdAt: 'desc' }
            },
            // transactions: {
            //     take: 20,
            //     orderBy: { createdAt: 'desc' },
            //     include: { user: true, product: true }
            // }
        }
    });

    if (!store) {
        notFound();
    }

    // Fetch Partners
    const partners = await prisma.user.findMany({
        where: {
            role: 'PARTNER',
            storeId: store.id
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true
        }
    });

    return (
        <div className="pb-12">
            <AdminStoreDetailClient store={store} partners={partners} />
        </div>
    );
}
